import type { CuePoint, Song, Track, Clip } from "@ableton-extensions/sdk";
import type { ExportSegment } from "./types.js";

function trackEndBeat(track: Track<"1.0.0">): number {
  let end = 0;
  for (const clip of track.arrangementClips) {
    const clipEnd = getClipEndBeat(clip);
    if (clipEnd > end) end = clipEnd;
  }
  return end;
}

function getClipEndBeat(clip: Clip<"1.0.0">): number {
  return clip.endTime;
}

export function makeSegmentId(startBeat: number, endBeat: number): string {
  return `${startBeat}-${endBeat}`;
}

export function filterSegmentsBySelection(
  segments: ExportSegment[],
  selectedIds: string[],
): ExportSegment[] {
  if (!selectedIds.length) return [];
  const selected = new Set(selectedIds);
  return segments.filter((segment) => selected.has(segment.id));
}

export function buildSegments(
  cuePoints: CuePoint<"1.0.0">[],
  tracks: Track<"1.0.0">[],
): ExportSegment[] {
  const sorted = [...cuePoints].sort((a, b) => a.time - b.time);
  if (sorted.length < 2) return [];

  const arrangementEnd = Math.max(
    ...tracks.map((t) => trackEndBeat(t)),
    sorted[sorted.length - 1]!.time + 1,
  );

  const segments: ExportSegment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]!;
    const end = sorted[i + 1]!;
    if (end.time <= start.time) continue;

    segments.push({
      id: makeSegmentId(start.time, end.time),
      name: start.name || `Section ${i + 1}`,
      startBeat: start.time,
      endBeat: end.time,
      hasClips: false,
    });
  }

  const last = sorted[sorted.length - 1]!;
  if (arrangementEnd > last.time) {
    segments.push({
      id: makeSegmentId(last.time, arrangementEnd),
      name: last.name || `Section ${sorted.length}`,
      startBeat: last.time,
      endBeat: arrangementEnd,
      hasClips: false,
    });
  }

  return segments.filter((segment) => segment.endBeat > segment.startBeat);
}

export function validateExportReadiness(
  song: Song<"1.0.0">,
  segmentCount: number,
): string[] {
  const warnings: string[] = [];

  if (song.cuePoints.length < 2) {
    warnings.push("Add at least two locators in Arrangement View.");
  }
  if (segmentCount === 0) {
    warnings.push("No export segments could be derived from locators.");
  }

  return warnings;
}
