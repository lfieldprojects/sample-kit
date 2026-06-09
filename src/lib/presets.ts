import type { ExportFormat } from "./types.js";

export interface DevicePreset {
  id: string;
  label: string;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  format: ExportFormat;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: "custom",
    label: "Custom",
    sampleRate: 44100,
    bitDepth: 24,
    format: "wav",
  },
  {
    id: "move",
    label: "Ableton Move",
    sampleRate: 48000,
    bitDepth: 16,
    format: "wav",
  },
  {
    id: "mpc",
    label: "Akai MPC",
    sampleRate: 44100,
    bitDepth: 16,
    format: "wav",
  },
  {
    id: "digitakt",
    label: "Elektron Digitakt",
    sampleRate: 48000,
    bitDepth: 16,
    format: "wav",
  },
  {
    id: "digitone",
    label: "Elektron Digitone",
    sampleRate: 48000,
    bitDepth: 16,
    format: "wav",
  },
  {
    id: "op1",
    label: "Teenage Engineering OP-1",
    sampleRate: 44100,
    bitDepth: 16,
    format: "wav",
  },
  {
    id: "torso-s4",
    label: "Torso Electronic S-4",
    sampleRate: 44100,
    bitDepth: 24,
    format: "wav",
  },
];

export function getPreset(id: string): DevicePreset {
  return DEVICE_PRESETS.find((p) => p.id === id) ?? DEVICE_PRESETS[0]!;
}
