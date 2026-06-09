export type ExportFormat = "wav";
export type ExportDestination = "project" | "storage";

export interface ExportOptions {
  presetId: string;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  format: ExportFormat;
  destination: ExportDestination;
  excludeSectionsWithoutClips: boolean;
  selectedSegmentIds: string[];
}

export interface ExportSegment {
  id: string;
  name: string;
  startBeat: number;
  endBeat: number;
  hasClips: boolean;
}

export interface DialogInitData {
  tracks: string[];
  segmentCount: number;
  segments: ExportSegment[];
  tempo: number;
  keyLabel: string;
  warnings: string[];
}

export interface ExportResult {
  exported: number;
  destination: ExportDestination;
  outputDir: string;
  files: string[];
  manifestPath: string;
  skipped: string[];
  deselected: string[];
  errors: string[];
}

export interface ResultExtraSection {
  heading: string;
  items: string[];
  variant?: "default" | "warning";
}

export interface SuccessResultView {
  exported: number;
  folderLabel: string;
  folderPath: string;
  files: string[];
  extraSections: ResultExtraSection[];
  manifestPath: string;
}

export type ResultDialogPayload =
  | { kind: "success"; data: SuccessResultView }
  | { kind: "error"; title: string; message: string };
