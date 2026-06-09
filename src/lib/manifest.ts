import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ExportDestination } from "./types.js";

export async function writeExportManifest(args: {
  directory: string;
  destination: ExportDestination;
  files: string[];
  outputDir: string;
}): Promise<string> {
  const manifestPath = path.join(args.directory, "export-manifest.json");
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        destination: args.destination,
        outputDir: args.outputDir,
        files: args.files,
      },
      null,
      2,
    ),
  );
  return manifestPath;
}
