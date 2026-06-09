import type { ExportOptions } from "./types.js";

export function normalizeExportOptions(raw: ExportOptions): ExportOptions {
  const sampleRate = Number(raw.sampleRate);
  const bitDepth = Number(raw.bitDepth);

  const selectedSegmentIds = Array.isArray(raw.selectedSegmentIds)
    ? raw.selectedSegmentIds.filter((id) => typeof id === "string" && id.length > 0)
    : [];

  return {
    presetId: raw.presetId,
    sampleRate: sampleRate === 48000 ? 48000 : 44100,
    bitDepth: bitDepth === 16 ? 16 : bitDepth === 32 ? 32 : 24,
    format: "wav",
    destination: raw.destination === "storage" ? "storage" : "project",
    excludeSectionsWithoutClips: raw.excludeSectionsWithoutClips !== false,
    selectedSegmentIds,
  };
}
