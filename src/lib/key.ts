import type { Song } from "@ableton-extensions/sdk";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export function getKeyLabel(song: Song<"1.0.0">): string {
  const root = NOTE_NAMES[song.rootNote] ?? "Unknown";
  const scale = song.scaleName?.trim();
  if (!scale) return root;
  return `${root} ${scale}`;
}
