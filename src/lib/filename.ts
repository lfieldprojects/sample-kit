import type { ExportOptions } from "./types.js";

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

export function sanitizeFilenamePart(value: string): string {
  return value.replace(INVALID_CHARS, "_").replace(/\s+/g, " ").trim();
}

export function buildFilename(args: {
  locatorName: string;
  trackName: string;
  keyLabel: string;
  tempo: number;
  options: ExportOptions;
}): string {
  const parts = [
    sanitizeFilenamePart(args.locatorName),
    sanitizeFilenamePart(args.trackName),
    sanitizeFilenamePart(args.keyLabel),
    `${Math.round(args.tempo)}bpm`,
  ].filter(Boolean);

  const base = parts.join(" - ");
  return `${base}.${args.options.format}`;
}
