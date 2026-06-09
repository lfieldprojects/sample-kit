import resultTemplate from "../result.html";
import resultCss from "../styles/result.css";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import type { ResultDialogPayload } from "./types.js";
import { composeUiStyles } from "./uiStyles.js";

const RESULT_DIALOG_WIDTH = 640;

function getResultDialogHeight(payload: ResultDialogPayload): number {
  if (payload.kind === "error") return 420;
  return 520;
}

export function buildResultDialogUrl(payload: ResultDialogPayload): string {
  const html = resultTemplate
    .replace("__STYLES__", composeUiStyles(resultCss))
    .replace(
      "__INIT_DATA__",
      JSON.stringify(payload).replace(/</g, "\\u003c"),
    );
  return `data:text/html,${encodeURIComponent(html)}`;
}

export async function showResultDialog(
  context: ExtensionContext<"1.0.0">,
  payload: ResultDialogPayload,
): Promise<void> {
  const url = buildResultDialogUrl(payload);
  await context.ui.showModalDialog(
    url,
    RESULT_DIALOG_WIDTH,
    getResultDialogHeight(payload),
  );
}
