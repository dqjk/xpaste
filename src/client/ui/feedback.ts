import type { Translator } from "../i18n/locale.js";

export type InteractionFailure = "clipboard-write" | "upload" | "generic";

/**
 * Displays one persistent, actionable interaction notice.
 *
 * Notices do not expire on a timer. They remain visible until the user dismisses them or
 * starts another interaction, which keeps failure lifecycles deterministic.
 */
export function showInteractionFailure(
  failure: InteractionFailure,
  translate: Translator
): void {
  const messageKey = failure === "clipboard-write"
    ? "feedback.clipboardWrite.message"
    : failure === "upload"
      ? "feedback.upload.message"
      : "feedback.generic.message";
  const titleKey = failure === "clipboard-write"
    ? "feedback.clipboardWrite.title"
    : failure === "upload"
      ? "feedback.upload.title"
      : "feedback.generic.title";

  const notice = document.createElement("section");
  notice.className = `interaction-notice interaction-notice--${failure}`;
  notice.dataset.role = "interaction-notice";
  notice.setAttribute("role", "alert");

  const content = document.createElement("div");
  content.className = "interaction-notice__content";

  const title = document.createElement("h2");
  title.textContent = translate(titleKey);
  const message = document.createElement("p");
  message.textContent = translate(messageKey);
  content.append(title, message);

  const dismissButton = document.createElement("button");
  dismissButton.type = "button";
  dismissButton.className = "interaction-notice__dismiss";
  dismissButton.dataset.action = "dismiss-notice";
  dismissButton.setAttribute("aria-label", translate("feedback.dismiss"));
  dismissButton.textContent = "×";
  dismissButton.addEventListener("click", dismissInteractionNotice);

  notice.append(content, dismissButton);
  replaceInteractionNotice(notice);
}

/**
 * Selects rendered card text so the user can complete a copy operation manually.
 */
export function selectTextForManualCopy(textElement: HTMLElement): void {
  const selection = globalThis.getSelection();
  if (!selection) {
    throw new Error("text selection is unavailable");
  }

  const range = document.createRange();
  range.selectNodeContents(textElement);
  selection.removeAllRanges();
  selection.addRange(range);
  textElement.focus({ preventScroll: true });
}

/**
 * Removes the current interaction notice, if one exists.
 */
export function dismissInteractionNotice(): void {
  document.querySelector<HTMLElement>("[data-role='interaction-notice']")?.remove();
}

function replaceInteractionNotice(notice: HTMLElement): void {
  dismissInteractionNotice();
  document.body.appendChild(notice);
}
