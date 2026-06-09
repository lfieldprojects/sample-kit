import type { Track } from "@ableton-extensions/sdk";
import type { ExportSegment } from "./types.js";

export function hasClipsInSegment(
  track: Track<"1.0.0">,
  segment: ExportSegment,
): boolean {
  return track.arrangementClips.some(
    (clip) =>
      clip.startTime < segment.endBeat && clip.endTime > segment.startBeat,
  );
}
