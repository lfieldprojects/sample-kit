import type { ArrangementSelection, Handle } from "@ableton-extensions/sdk";
import {
  AudioTrack,
  DataModelObject,
  initialize,
  type ActivationContext,
  type ExtensionContext,
} from "@ableton-extensions/sdk";

import { buildDialogUrl, getDialogDimensions } from "./lib/dialog.js";
import {
  buildSuccessResultView,
  exportSamples,
} from "./lib/exportSamples.js";
import { getKeyLabel } from "./lib/key.js";
import { normalizeExportOptions } from "./lib/normalizeOptions.js";
import { showResultDialog } from "./lib/resultDialog.js";
import { hasClipsInSegment } from "./lib/clips.js";
import {
  buildSegments,
  filterSegmentsBySelection,
  validateExportReadiness,
} from "./lib/segments.js";
import type {
  DialogInitData,
  ExportOptions,
  ResultDialogPayload,
} from "./lib/types.js";

const COMMAND_ID = "locatorSampleExporter.export";

function isArrangementSelection(arg: unknown): arg is ArrangementSelection {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "selected_lanes" in arg &&
    "time_selection_start" in arg
  );
}

function resolveAudioTracks(
  context: ExtensionContext<"1.0.0">,
  arg: unknown,
): AudioTrack<"1.0.0">[] {
  if (isArrangementSelection(arg)) {
    return arg.selected_lanes
      .map((handle) => context.getObjectFromHandle(handle, DataModelObject))
      .filter((obj): obj is AudioTrack<"1.0.0"> => obj instanceof AudioTrack);
  }

  try {
    const track = context.getObjectFromHandle(arg as Handle, AudioTrack);
    return [track];
  } catch (error) {
    console.error(
      "[Sample Kit] Selected item is not an audio track.",
      error,
    );
    return [];
  }
}

function buildDialogInit(
  context: ExtensionContext<"1.0.0">,
  tracks: AudioTrack<"1.0.0">[],
): DialogInitData {
  const song = context.application.song!;
  const segments = buildSegments(song.cuePoints, tracks).map((segment) => ({
    ...segment,
    hasClips: tracks.some((track) => hasClipsInSegment(track, segment)),
  }));
  const warnings = validateExportReadiness(song, segments.length);

  return {
    tracks: tracks.map((t) => t.name),
    segmentCount: segments.length,
    segments,
    tempo: song.tempo,
    keyLabel: getKeyLabel(song),
    warnings,
  };
}

function parseDialogResult(raw: string): {
  action: "export" | "cancel";
  options?: ExportOptions;
} {
  if (!raw) return { action: "cancel" };

  try {
    const parsed = JSON.parse(raw) as {
      action?: string;
      options?: ExportOptions;
    };
    if (parsed.action === "export" && parsed.options) {
      return {
        action: "export",
        options: normalizeExportOptions(parsed.options),
      };
    }
  } catch (error) {
    console.error("[Sample Kit] Could not parse dialog result:", error);
  }

  return { action: "cancel" };
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function activate(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");
  const { tempDirectory, storageDirectory } = context.environment;
  console.log("[Sample Kit] Extension activated.");
  console.log(
    `[Sample Kit] temp=${tempDirectory ?? "unavailable"} storage=${storageDirectory ?? "unavailable"}`,
  );

  context.commands.registerCommand(COMMAND_ID, (arg: unknown) =>
    void (async () => {
      const tracks = resolveAudioTracks(context, arg);
      if (!tracks.length) {
        await showResultDialog(context, {
          kind: "error",
          title: "Export failed",
          message:
            "No audio tracks selected.\n\nFreeze MIDI tracks or right-click an audio track.",
        });
        return;
      }

      const init = buildDialogInit(context, tracks);
      const dialogUrl = buildDialogUrl(init);
      const { width, height } = getDialogDimensions(init);
      const raw = await context.ui.showModalDialog(dialogUrl, width, height);
      const result = parseDialogResult(raw);
      if (result.action !== "export" || !result.options) return;

      const song = context.application.song!;
      const allSegments = buildSegments(song.cuePoints, tracks);
      const segments = filterSegmentsBySelection(
        allSegments,
        result.options.selectedSegmentIds,
      );
      const selectedIds = new Set(segments.map((segment) => segment.id));
      const deselectedSegmentNames = allSegments
        .filter((segment) => !selectedIds.has(segment.id))
        .map((segment) => segment.name);
      if (!allSegments.length) {
        await showResultDialog(context, {
          kind: "error",
          title: "Export failed",
          message: "Need at least two locators with valid ranges between them.",
        });
        return;
      }
      if (!segments.length) {
        await showResultDialog(context, {
          kind: "error",
          title: "Export failed",
          message: "Select at least one segment to export.",
        });
        return;
      }

      let resultPayload: ResultDialogPayload | null = null;

      try {
        await context.ui.withinProgressDialog(
          "Exporting locator samples…",
          { progress: 0 },
          async (update, abortSignal) => {
            try {
              const exportResult = await exportSamples({
                context,
                song,
                tracks,
                segments,
                options: result.options!,
                abortSignal,
                onProgress: async (message, percent) => {
                  await update(message, percent);
                },
              });

              resultPayload = {
                kind: "success",
                data: buildSuccessResultView({
                  ...exportResult,
                  deselected: deselectedSegmentNames,
                }),
              };
            } catch (error) {
              if (abortSignal.aborted) return;
              resultPayload = {
                kind: "error",
                title: "Export failed",
                message: formatError(error),
              };
            }
          },
        );
      } catch (error) {
        resultPayload = {
          kind: "error",
          title: "Export failed",
          message: formatError(error),
        };
      }

      if (resultPayload) {
        await showResultDialog(context, resultPayload);
      }
    })().catch(async (error) => {
      console.error("[Sample Kit]", error);
      try {
        await showResultDialog(context, {
          kind: "error",
          title: "Export failed",
          message: formatError(error),
        });
      } catch (dialogError) {
        console.error("[Sample Kit] Could not show result dialog:", dialogError);
      }
    }),
  );

  context.ui.registerContextMenuAction(
    "AudioTrack",
    "Export Locator Samples…",
    COMMAND_ID,
  );

  context.ui.registerContextMenuAction(
    "AudioTrack.ArrangementSelection",
    "Export Locator Samples…",
    COMMAND_ID,
  );
}
