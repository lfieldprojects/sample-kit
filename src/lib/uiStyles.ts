import liveUi from "../styles/live-ui.css";
import { UI_FONT_CSS } from "./uiFonts.js";

export function composeUiStyles(...pageCss: string[]): string {
  return [UI_FONT_CSS, liveUi, ...pageCss].join("\n");
}
