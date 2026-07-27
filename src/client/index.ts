import type { ServerEvent } from "../shared/index.js";
import { postFileData, postTextData } from "./api/http-client.js";
import { copyText, openResourcePreview, readResourceText, saveResource } from "./api/resource-client.js";
import { ensureDeviceIdCookie } from "./app/device-cookie.js";
import { connectEventStream } from "./app/event-source.js";
import { createTranslator, getBrowserLocale } from "./i18n/locale.js";
import { ApplicationStore } from "./state/store.js";
import { buildApplicationViewModel, type DataItemCardViewModel } from "./state/view-model.js";
import { observeTextOverflow, renderApplication } from "./ui/render.js";
import {
  dismissInteractionNotice,
  selectTextForManualCopy,
  showInteractionFailure,
  type InteractionFailure
} from "./ui/feedback.js";

const applicationStore = new ApplicationStore();
const dataItemsById = new Map<string, DataItemCardViewModel>();
const locale = getBrowserLocale();
const translate = createTranslator(locale);

/**
 * Client bootstrap entry point.
 *
 * The lifecycle is deliberately linear: ensure identity, resolve DOM roots, bind user actions,
 * subscribe rendering, then open the SSE stream.
 */
function main(): void {
  document.documentElement.lang = locale;
  ensureDeviceIdCookie();
  const rootElement = requireRootElement();
  bindApplicationActions(rootElement);
  observeTextOverflow(rootElement);

  applicationStore.subscribe((state) => {
    const devices = Array.from(state.devicesById.values()).sort((left, right) => right.connectedAt - left.connectedAt);
    const viewModel = buildApplicationViewModel(devices);
    dataItemsById.clear();
    for (const item of viewModel.items) {
      dataItemsById.set(item.dataId, item);
    }

    renderApplication(rootElement, viewModel, translate);
  });

  connectEventStream((event) => {
    applyServerEvent(event);
  });
}

/**
 * Attaches event delegation for composer actions and per-card item actions.
 */
function bindApplicationActions(rootElement: HTMLElement): void {
  bindWindowDropUpload();
  bindWindowPasteUpload(rootElement);

  rootElement.addEventListener("submit", (event) => {
    event.preventDefault();
    const textForm = event.target;
    if (!(textForm instanceof HTMLFormElement) || textForm.dataset.role !== "text-form") {
      return;
    }

    const formData = new FormData(textForm);
    const text = String(formData.get("text") ?? "").trim();
    if (!text) {
      return;
    }

    void runUserInteraction("upload", async () => {
      await postTextData({ text });
      textForm.reset();
    });
  });

  rootElement.addEventListener("change", (event) => {
    const fileInput = event.target;
    if (!(fileInput instanceof HTMLInputElement) || fileInput.dataset.role !== "picker-input") {
      return;
    }

    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }

    void runUserInteraction("upload", async () => {
      await postFileData(file);
      fileInput.value = "";
    });
  });

  rootElement.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionButton = target.closest<HTMLElement>("[data-action]");
    if (!actionButton) {
      return;
    }

    const actionName = actionButton.dataset.action;
    if (!actionName) {
      return;
    }

    suppressHoverUntilPointerLeaves(actionButton);

    if (actionName === "dismiss-notice") {
      dismissInteractionNotice();
      return;
    }

    if (actionName === "toggle-text") {
      toggleInlineText(actionButton);
      return;
    }

    if (actionName === "pick-file") {
      const input = rootElement.querySelector<HTMLInputElement>(
        `input[data-role='picker-input'][data-picker='${actionButton.dataset.picker ?? ""}']`
      );
      input?.click();
      return;
    }

    const dataId = actionButton.dataset.dataId;
    if (!dataId) {
      return;
    }

    const dataItem = dataItemsById.get(dataId);
    if (!dataItem) {
      return;
    }

    if (!dataItem.available && !dataItem.inline) {
      return;
    }

    if (actionName === "copy") {
      void copyDataItem(rootElement, actionButton, dataItem);
      return;
    }

    if (actionName === "preview" || actionName === "open") {
      void runUserInteraction("generic", () => {
        openResourcePreview(dataItem.deviceId, dataItem.dataId);
      });
      return;
    }

    if (actionName === "save") {
      void runUserInteraction("generic", async () => {
        await saveResource(dataItem.deviceId, dataItem.dataId, dataItem.title);
      });
    }
  });
}

/**
 * Converts a user-initiated paste anywhere in the page into an immediate upload.
 *
 * Clipboard event data remains available on insecure LAN origins because it is supplied by
 * the browser as part of the explicit paste gesture. Binary entries take precedence over text.
 */
function bindWindowPasteUpload(rootElement: HTMLElement): void {
  window.addEventListener("paste", (event) => {
    const payload = readPastePayload(event);
    if (!payload) {
      return;
    }

    event.preventDefault();
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.role === "text-input") {
      target.value = "";
    }

    void runUserInteraction("upload", async () => {
      for (const file of payload.files) {
        await postFileData(file);
      }
      if (payload.text) {
        await postTextData({ text: payload.text });
      }
    }, () => {
      rootElement.querySelector<HTMLInputElement>("[data-role='text-input']")?.focus();
    });
  });
}

/**
 * Reads supported clipboard data synchronously while the paste event is active.
 */
function readPastePayload(event: ClipboardEvent): PastePayload | undefined {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return undefined;
  }

  const files = Array.from(clipboardData.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
    .map(normalizeClipboardFile);

  if (files.length > 0) {
    return { files, text: "" };
  }

  const text = clipboardData.getData("text/plain").trim();
  return text ? { files: [], text } : undefined;
}

/**
 * Supplies a stable name when a browser exposes a pasted binary object without one.
 */
function normalizeClipboardFile(file: File): File {
  if (file.name) {
    return file;
  }

  return new File([file], buildClipboardFileName(file.type), {
    type: file.type,
    lastModified: file.lastModified
  });
}

/**
 * Enables global drag-and-drop uploads so the current window can accept files without
 * additional drop zones or secondary confirmation UI.
 */
function bindWindowDropUpload(): void {
  window.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.files.length) {
      return;
    }

    event.preventDefault();
  });

  window.addEventListener("drop", (event) => {
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!files.length) {
      return;
    }

    event.preventDefault();
    void runUserInteraction("upload", async () => {
      for (const file of files) {
        await postFileData(file);
      }
    });
  });
}

/**
 * Copies a card's complete text and selects its visible content when browser policy blocks
 * automatic clipboard writes.
 */
async function copyDataItem(
  rootElement: HTMLElement,
  actionButton: HTMLElement,
  dataItem: DataItemCardViewModel
): Promise<void> {
  let text = dataItem.preview;
  await runUserInteraction("clipboard-write", async () => {
    if (!dataItem.inline) {
      text = await readResourceText(dataItem.deviceId, dataItem.dataId);
    }
    await copyText(text);
  }, () => {
    const textElement = actionButton
      .closest<HTMLElement>(".data-item")
      ?.querySelector<HTMLElement>("[data-role='text-content']");
    if (textElement) {
      selectTextForManualCopy(textElement);
    } else {
      const input = rootElement.querySelector<HTMLInputElement>("[data-role='text-input']");
      if (input) {
        input.value = text;
        input.focus();
        input.select();
      }
    }
  });
}

/**
 * Switches a text card between its three-line preview and complete content.
 */
function toggleInlineText(toggleButton: HTMLElement): void {
  const container = toggleButton.closest<HTMLElement>(".data-item__inline-text");
  if (!container) {
    return;
  }

  const expanded = container.dataset.expanded === "true";
  container.dataset.expanded = String(!expanded);
  toggleButton.textContent = expanded
    ? toggleButton.dataset.collapsedLabel ?? ""
    : toggleButton.dataset.expandedLabel ?? "";
}

/**
 * Prevents a pointer hover treatment from visually sticking after activation.
 *
 * The state is cleared by the pointer lifecycle itself rather than an arbitrary timer.
 */
function suppressHoverUntilPointerLeaves(actionButton: HTMLElement): void {
  if (!actionButton.classList.contains("button") || !globalThis.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  actionButton.dataset.suppressHover = "true";
  actionButton.addEventListener("pointerleave", () => {
    delete actionButton.dataset.suppressHover;
  }, { once: true });
}

/**
 * Defines the single error boundary for asynchronous user interactions.
 */
async function runUserInteraction(
  failure: InteractionFailure,
  action: () => void | Promise<void>,
  recover?: () => void
): Promise<void> {
  dismissInteractionNotice();
  try {
    await action();
  } catch (error) {
    recover?.();
    showInteractionFailure(failure, translate);
    console.error(error);
  }
}

/**
 * Derives a stable clipboard upload file name from the MIME type.
 */
function buildClipboardFileName(mimeType: string): string {
  const [, subtype = "bin"] = mimeType.split("/");
  const normalizedSubtype = subtype.replace(/[^a-z0-9.+-]/gi, "-").toLowerCase();
  return `clipboard.${normalizedSubtype || "bin"}`;
}

type PastePayload = {
  files: File[];
  text: string;
};

/**
 * Routes transport events into explicit store transitions.
 */
function applyServerEvent(event: ServerEvent): void {
  switch (event.type) {
    case "device-list":
      applicationStore.applyDeviceList(event);
      return;
    case "device-connected":
      applicationStore.applyDeviceConnected(event);
      return;
    case "device-offline":
      applicationStore.applyDeviceOffline(event);
      return;
    case "data-created":
      applicationStore.applyDataCreated(event);
      return;
  }
}

/**
 * Resolves the single application mount point and fails fast if the page shell is inconsistent.
 */
function requireRootElement(): HTMLElement {
  const element = document.querySelector<HTMLElement>("[data-role='app']");
  if (!element) {
    throw new Error("missing application root element");
  }

  return element;
}

void main();
