import * as fs from "node:fs/promises";
import { WaveFile } from "wavefile";
import type { ExportOptions } from "./types.js";

function bitDepthToWaveFormat(bitDepth: ExportOptions["bitDepth"]): string {
  if (bitDepth === 16) return "16";
  if (bitDepth === 24) return "24";
  return "32f";
}

export async function processRenderedWav(
  inputPath: string,
  outputPath: string,
  options: ExportOptions,
): Promise<void> {
  try {
    const input = await fs.readFile(inputPath);
    const wav = new WaveFile(input);
    const currentRate = (wav.fmt as { sampleRate?: number }).sampleRate;

    if (currentRate !== options.sampleRate) {
      wav.toSampleRate(options.sampleRate);
    }

    wav.toBitDepth(bitDepthToWaveFormat(options.bitDepth));
    await fs.writeFile(outputPath, Buffer.from(wav.toBuffer()));
  } catch (error) {
    console.warn(
      "[Sample Kit] WAV processing failed, using rendered file as-is:",
      error,
    );
    await fs.copyFile(inputPath, outputPath);
  }
}
