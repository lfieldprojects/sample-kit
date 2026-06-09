import dialogTemplate from "../dialog.html";
import dialogCss from "../styles/dialog.css";
import { DEVICE_PRESETS } from "./presets.js";
import type { DialogInitData } from "./types.js";
import { composeUiStyles } from "./uiStyles.js";

const DIALOG_WIDTH = 1080;
const DIALOG_BASE_HEIGHT = 820;
const DIALOG_MAX_HEIGHT = 980;
const DIALOG_HEIGHT_PER_SEGMENT = 18;

export function getDialogDimensions(init: DialogInitData): {
  width: number;
  height: number;
} {
  const segmentExtra = Math.max(0, init.segments.length - 6) * DIALOG_HEIGHT_PER_SEGMENT;
  return {
    width: DIALOG_WIDTH,
    height: Math.min(DIALOG_MAX_HEIGHT, DIALOG_BASE_HEIGHT + segmentExtra),
  };
}

export function buildDialogUrl(init: DialogInitData): string {
  const payload = {
    init,
    presets: DEVICE_PRESETS,
  };
  const html = dialogTemplate
    .replace("__STYLES__", composeUiStyles(dialogCss))
    .replace(
      "__INIT_DATA__",
      JSON.stringify(payload).replace(/</g, "\\u003c"),
    );
  return `data:text/html,${encodeURIComponent(html)}`;
}
