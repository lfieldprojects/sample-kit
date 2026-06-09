import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AudioTrack, ExtensionContext, Song } from "@ableton-extensions/sdk";
import { buildFilename } from "./filename.js";
import { getKeyLabel } from "./key.js";
import { writeExportManifest } from "./manifest.js";
import { hasClipsInSegment } from "./clips.js";
import { processRenderedWav } from "./processAudio.js";
import type {
  ExportDestination,
  ExportOptions,
  ExportResult,
  ExportSegment,
  SuccessResultView,
} from "./types.js";

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function requireDirectory(
  dir: string | undefined,
  label: string,
): string {
  if (!dir) throw new Error(`${label} is unavailable in this Live session.`);
  return dir;
}

async function fileSize(filePath: string): Promise<number> {
  const stat = await fs.stat(filePath);
  return stat.size;
}

function formatSegmentError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error === undefined || error === null) return "Unknown error";
  return String(error);
}

export async function exportSamples(args: {
  context: ExtensionContext<"1.0.0">;
  song: Song<"1.0.0">;
  tracks: AudioTrack<"1.0.0">[];
  segments: ExportSegment[];
  options: ExportOptions;
  onProgress: (message: string, percent: number) => Promise<void>;
  abortSignal: AbortSignal;
}): Promise<ExportResult> {
  const { context, song, tracks, segments, options, onProgress, abortSignal } =
    args;

  if (!segments.length) {
    throw new Error("No valid locator segments to export.");
  }

  const keyLabel = getKeyLabel(song);
  const tempo = song.tempo;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const batchDir = path.join(
    requireDirectory(context.environment.tempDirectory, "Temp directory"),
    `locator-export-${timestamp}`,
  );
  await ensureDir(batchDir);

  const total = tracks.length * segments.length;
  let completed = 0;
  const processedFiles: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const track of tracks) {
    for (const segment of segments) {
      if (abortSignal.aborted) {
        throw new Error("Export cancelled");
      }

      completed += 1;
      const label = `${track.name} — ${segment.name}`;
      const percent = Math.round((completed / total) * 90);

      try {
        if (
          options.excludeSectionsWithoutClips &&
          !hasClipsInSegment(track, segment)
        ) {
          await onProgress(`Skipping ${label} — no clips (${completed}/${total})`, percent);
          const message = `${label}: no clips on this track in this locator range`;
          skipped.push(message);
          console.log(`[Sample Kit] Skipped — ${message}`);
          continue;
        }

        await onProgress(`Rendering ${label} (${completed}/${total})`, percent);
        console.log(
          `[Sample Kit] renderPreFxAudio ${label}: ${segment.startBeat}–${segment.endBeat} beats`,
        );

        const renderedPath = await context.resources.renderPreFxAudio(
          track,
          segment.startBeat,
          segment.endBeat,
        );

        const renderedSize = await fileSize(renderedPath);
        console.log(
          `[Sample Kit] Rendered to ${renderedPath} (${renderedSize} bytes)`,
        );

        const filename = buildFilename({
          locatorName: segment.name,
          trackName: track.name,
          keyLabel,
          tempo,
          options,
        });

        const processedPath = path.join(batchDir, filename);
        await processRenderedWav(renderedPath, processedPath, options);
        processedFiles.push(processedPath);
        console.log(`[Sample Kit] Processed ${processedPath}`);
      } catch (error) {
        const message = formatSegmentError(error);
        errors.push(`${label}: ${message}`);
        console.error(`[Sample Kit] Failed ${label}:`, error);
      }
    }
  }

  if (!processedFiles.length) {
    const detail = [...errors, ...skipped].join("\n");
    throw new Error(
      "No samples were exported.\n\n" +
        (detail || "Check that the track has arrangement audio between locators."),
    );
  }

  let outputDir = batchDir;
  let destination = options.destination;
  const importErrors: string[] = [];

  if (options.destination === "project") {
    await onProgress("Copying samples into Live project…", 92);
    const projectFiles: string[] = [];

    for (const filePath of processedFiles) {
      try {
        const imported = await context.resources.importIntoProject(filePath);
        projectFiles.push(imported);
        console.log(`[Sample Kit] Imported into project: ${imported}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        importErrors.push(`${path.basename(filePath)}: ${message}`);
        console.error(
          `[Sample Kit] importIntoProject failed for ${filePath}:`,
          error,
        );
      }
    }

    if (projectFiles.length) {
      outputDir = path.dirname(projectFiles[0]!);
      processedFiles.splice(0, processedFiles.length, ...projectFiles);
      errors.push(...importErrors);
    } else {
      destination = "storage";
      outputDir = await copyToStorage(
        context,
        processedFiles,
        timestamp,
        onProgress,
      );
      processedFiles.splice(
        0,
        processedFiles.length,
        ...(await listFiles(outputDir)),
      );
      errors.push(
        "Project import failed for all files. Files were saved to extension storage instead.",
        ...importErrors,
      );
    }
  } else {
    outputDir = await copyToStorage(
      context,
      processedFiles,
      timestamp,
      onProgress,
    );
    processedFiles.splice(
      0,
      processedFiles.length,
      ...(await listFiles(outputDir)),
    );
  }

  const manifestDir = path.join(
    requireDirectory(context.environment.storageDirectory, "Storage directory"),
    "locator-exports",
    timestamp,
  );
  await ensureDir(manifestDir);
  const manifestPath = await writeExportManifest({
    directory: manifestDir,
    destination,
    files: processedFiles,
    outputDir,
  });
  console.log(`[Sample Kit] Manifest written: ${manifestPath}`);

  return {
    exported: processedFiles.length,
    destination,
    outputDir,
    files: processedFiles,
    manifestPath,
    skipped,
    deselected: [],
    errors,
  };
}

async function copyToStorage(
  context: ExtensionContext<"1.0.0">,
  files: string[],
  timestamp: string,
  onProgress: (message: string, percent: number) => Promise<void>,
): Promise<string> {
  const storageDir = path.join(
    requireDirectory(
      context.environment.storageDirectory,
      "Storage directory",
    ),
    "locator-exports",
    timestamp,
  );
  await ensureDir(storageDir);
  await onProgress("Saving samples to extension storage…", 95);

  for (const filePath of files) {
    const dest = path.join(storageDir, path.basename(filePath));
    await fs.copyFile(filePath, dest);
    console.log(`[Sample Kit] Saved to storage: ${dest}`);
  }

  return storageDir;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory);
  return entries
    .filter((name) => name.endsWith(".wav"))
    .map((name) => path.join(directory, name));
}

export function destinationLabel(
  destination: ExportDestination,
  outputDir: string,
): string {
  if (destination === "project") {
    return `Live project folder:\n${outputDir}`;
  }
  return `Extension storage:\n${outputDir}`;
}

export function buildSuccessResultView(result: ExportResult): SuccessResultView {
  const extraSections = [];

  if (result.deselected.length) {
    extraSections.push({
      heading: "Not exported (deselected)",
      items: result.deselected,
    });
  }

  if (result.skipped.length) {
    extraSections.push({
      heading: "Skipped",
      items: result.skipped,
    });
  }

  if (result.errors.length) {
    extraSections.push({
      heading: "Warnings",
      items: result.errors,
      variant: "warning" as const,
    });
  }

  const files = result.files
    .map((file) => {
      const value = String(file).trim();
      if (!value) return "";
      return path.basename(value);
    })
    .filter(Boolean);

  return {
    exported: result.exported,
    folderLabel:
      result.destination === "project"
        ? "Live project folder:"
        : "Extension storage:",
    folderPath: result.outputDir,
    files,
    extraSections,
    manifestPath: result.manifestPath,
  };
}
