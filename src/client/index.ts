import type { ServerEvent } from "../shared/index.js";
import { postFileData, postTextData } from "./api/http-client.js";
import { copyResourceText, copyText, openResourcePreview, saveResource } from "./api/resource-client.js";
import { ensureDeviceIdCookie } from "./app/device-cookie.js";
import { connectEventStream } from "./app/event-source.js";
import { createTranslator, getBrowserLocale } from "./i18n/locale.js";
import { ApplicationStore } from "./state/store.js";
import { buildApplicationViewModel, type DataItemCardViewModel } from "./state/view-model.js";
import { renderApplication } from "./ui/render.js";

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

  rootElement.addEventListener("submit", async (event) => {
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

    await postTextData({ text });
    textForm.reset();
  });

  rootElement.addEventListener("change", async (event) => {
    const fileInput = event.target;
    if (!(fileInput instanceof HTMLInputElement) || fileInput.dataset.role !== "picker-input") {
      return;
    }

    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }

    await postFileData(file);
    fileInput.value = "";
  });

  rootElement.addEventListener("paste", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.role !== "text-input") {
      return;
    }

    const pastedText = event.clipboardData?.getData("text/plain")?.trim() ?? "";
    if (!pastedText) {
      return;
    }

    event.preventDefault();
    await postTextData({ text: pastedText });
    target.value = "";
  });

  rootElement.addEventListener("click", async (event) => {
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

    if (actionName === "pick-file") {
      const input = rootElement.querySelector<HTMLInputElement>(`[data-picker='${actionButton.dataset.picker ?? ""}']`);
      input?.click();
      return;
    }

    if (actionName === "paste-clipboard") {
      await uploadClipboardData(rootElement);
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
      if (dataItem.inline) {
        await copyText(dataItem.preview);
        return;
      }

      await copyResourceText(dataItem.deviceId, dataItem.dataId);
      return;
    }

    if (actionName === "preview" || actionName === "open") {
      openResourcePreview(dataItem.deviceId, dataItem.dataId);
      return;
    }

    if (actionName === "save") {
      await saveResource(dataItem.deviceId, dataItem.dataId, dataItem.title);
    }
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

  window.addEventListener("drop", async (event) => {
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!files.length) {
      return;
    }

    event.preventDefault();
    for (const file of files) {
      await postFileData(file);
    }
  });
}

/**
 * Resolves the most meaningful clipboard payload and uploads it immediately.
 *
 * Binary clipboard entries take precedence so screenshots and copied files behave like
 * first-class DataItems. When direct clipboard APIs are unavailable or denied, the text
 * area is focused as a fallback so the user can paste manually.
 */
async function uploadClipboardData(rootElement: HTMLElement): Promise<void> {
  const clipboard = navigator.clipboard;
  if (!clipboard) {
    focusTextInput(rootElement);
    return;
  }

  if (typeof clipboard.read === "function") {
    try {
      const clipboardItems = await clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const mimeType of clipboardItem.types) {
          if (mimeType === "text/plain") {
            continue;
          }

          const blob = await clipboardItem.getType(mimeType);
          const fileName = buildClipboardFileName(mimeType);
          await postFileData(new File([blob], fileName, { type: blob.type || mimeType }));
          return;
        }
      }
    } catch {
      focusTextInput(rootElement);
      return;
    }
  }

  if (typeof clipboard.readText === "function") {
    try {
      const text = (await clipboard.readText()).trim();
      if (text) {
        await postTextData({ text });
        return;
      }
    } catch {
      focusTextInput(rootElement);
      return;
    }
  }

  focusTextInput(rootElement);
}

/**
 * Moves focus into the manual paste field when automatic clipboard access is unavailable.
 */
function focusTextInput(rootElement: HTMLElement): void {
  const textInput = rootElement.querySelector<HTMLInputElement>("[data-role='text-input']");
  textInput?.focus();
}

/**
 * Derives a stable clipboard upload file name from the MIME type.
 */
function buildClipboardFileName(mimeType: string): string {
  const [, subtype = "bin"] = mimeType.split("/");
  const normalizedSubtype = subtype.replace(/[^a-z0-9.+-]/gi, "-").toLowerCase();
  return `clipboard.${normalizedSubtype || "bin"}`;
}

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
