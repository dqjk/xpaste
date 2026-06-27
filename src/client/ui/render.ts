import type { ApplicationViewModel, DataItemCardViewModel } from "../state/view-model.js";

/**
 * Re-renders the whole application view from a plain view model.
 */
export function renderApplication(rootElement: HTMLElement, viewModel: ApplicationViewModel): void {
  rootElement.replaceChildren(buildLayout(viewModel));
}

/**
 * Builds the responsive page shell from state-only data.
 */
function buildLayout(viewModel: ApplicationViewModel): HTMLElement {
  const page = document.createElement("main");
  page.className = "page";

  const topBar = document.createElement("header");
  topBar.className = "top-bar";
  topBar.append(buildBrandBlock(), buildSettingsButton());

  const gridSection = document.createElement("section");
  gridSection.className = "items";

  const gridHeader = document.createElement("div");
  gridHeader.className = "items__header";
  gridHeader.innerHTML = "<h2>DataItems</h2>";

  const itemGrid = document.createElement("div");
  itemGrid.className = "item-grid";
  for (const item of viewModel.items) {
    itemGrid.appendChild(buildDataItemCard(item));
  }
  gridSection.append(gridHeader, itemGrid);

  page.append(topBar, buildQuickShareBlock(), gridSection);
  return page;
}

/**
 * Builds a minimal brand block so the page keeps a clear identity without consuming
 * vertical space that should belong to the DataItem content.
 */
function buildBrandBlock(): HTMLElement {
  const brand = document.createElement("div");
  brand.className = "top-bar__brand";

  const wordmark = document.createElement("span");
  wordmark.className = "top-bar__wordmark";
  wordmark.textContent = "xpaste";

  brand.append(wordmark);
  return brand;
}

/**
 * Adds a single lightweight settings affordance in the top-right corner to match the
 * “use and leave” product direction.
 */
function buildSettingsButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.setAttribute("aria-label", "Settings");
  button.title = "Settings";
  button.append(buildActionIcon("settings"));
  return button;
}

/**
 * Builds a single content card with preview, source identity, and direct actions.
 */
function buildDataItemCard(item: DataItemCardViewModel): HTMLElement {
  const article = document.createElement("article");
  article.className = `data-item data-item--${item.kind}${item.available ? "" : " data-item--unavailable"}`;

  const body = document.createElement("div");
  body.className = "data-item__body";

  const summary = document.createElement("div");
  summary.className = "data-item__summary";
  if (item.kind !== "text") {
    summary.appendChild(buildIcon(item.kind, "large"));
  }

  const summaryText = document.createElement("div");
  summaryText.className = "data-item__summary-text";
  if (item.title) {
    const title = document.createElement("h3");
    title.textContent = item.title;
    summaryText.appendChild(title);
  }
  const previewText = document.createElement("p");
  previewText.textContent = item.preview;
  summaryText.appendChild(previewText);
  summary.appendChild(summaryText);
  body.appendChild(summary);

  if (item.kind === "image" || item.kind === "video") {
    const preview = document.createElement("div");
    preview.className = `data-item__preview data-item__preview--${item.kind}`;
    if (item.kind === "video") {
      const play = document.createElement("span");
      play.className = "data-item__play";
      play.append(buildActionIcon("preview"));
      preview.appendChild(play);
    }
    body.appendChild(preview);
  }

  const actions = document.createElement("div");
  actions.className = "data-item__actions";
  for (const action of buildActionDefinitions(item)) {
    actions.appendChild(buildCardActionButton(item, action));
  }

  const footer = document.createElement("footer");
  footer.className = "data-item__footer";
  footer.append(buildSourceBadge(item), buildFooterMeta(item));

  article.append(body, actions, footer);
  return article;
}

function buildActionDefinitions(item: DataItemCardViewModel): ActionDefinition[] {
  if (item.kind === "text") {
    return [
      {
        name: "copy",
        label: "Copy",
        primary: true,
        disabled: false
      }
    ];
  }

  const unavailable = !item.available;
  if (item.kind === "image" || item.kind === "video") {
    return [
      {
        name: "preview",
        label: "Preview",
        primary: true,
        disabled: unavailable
      },
      {
        name: "save",
        label: item.kind === "image" ? "Save" : "Save",
        primary: false,
        disabled: unavailable
      }
    ];
  }

  return [
    {
      name: "open",
      label: "Open",
      primary: true,
      disabled: unavailable
    },
    {
      name: "save",
      label: "Save",
      primary: false,
      disabled: unavailable
    }
  ];
}

/**
 * Renders the compact card actions used consistently across desktop, tablet, and mobile.
 */
function buildCardActionButton(
  item: DataItemCardViewModel,
  action: ActionDefinition
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = action.primary
    ? "button button--action button--action-primary"
    : "button button--action";
  button.dataset.action = action.name;
  button.dataset.dataId = item.dataId;
  button.disabled = action.disabled;
  button.append(buildActionIcon(action.name));

  const label = document.createElement("span");
  label.className = "button__label";
  label.textContent = action.label;
  button.appendChild(label);

  return button;
}

function buildIcon(kind: DataItemCardViewModel["kind"], size: "small" | "large" = "small"): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.className = `data-icon data-icon--${kind} data-icon--${size}`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (kind === "text") {
    svg.innerHTML = `
      <path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    `;
  } else if (kind === "image") {
    svg.innerHTML = `
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="15.5" cy="9.5" r="1.5" fill="currentColor"/>
      <path d="M7 16l3.5-3.5L13 15l2-2 2 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `;
  } else if (kind === "video") {
    svg.innerHTML = `
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M11 10l4 2-4 2z" fill="currentColor"/>
    `;
  } else {
    svg.innerHTML = `
      <path d="M8 4h6l4 4v12H8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
      <path d="M14 4v4h4" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
    `;
  }

  wrapper.appendChild(svg);
  return wrapper;
}

function buildFooterMeta(item: DataItemCardViewModel): HTMLElement {
  const meta = document.createElement("div");
  meta.className = "data-item__footer-meta";
  meta.appendChild(buildIcon(item.kind));

  if (!item.inline) {
    const badge = document.createElement("span");
    badge.className = `availability-badge${item.available ? "" : " availability-badge--muted"}`;
    badge.textContent = item.available ? "Available" : "Unavailable";
    meta.appendChild(badge);
  }

  return meta;
}

function buildQuickShareBlock(): HTMLElement {
  const container = document.createElement("section");
  container.className = "quick-share";

  const form = document.createElement("form");
  form.className = "quick-share__form";
  form.dataset.role = "text-form";

  const input = document.createElement("input");
  input.dataset.role = "text-input";
  input.name = "text";
  input.type = "text";
  input.placeholder = "Enter text to send...";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "button button--secondary";
  submitButton.textContent = "Send";

  const pasteButton = document.createElement("button");
  pasteButton.type = "button";
  pasteButton.className = "button button--primary quick-share__paste-button";
  pasteButton.dataset.action = "paste-clipboard";
  pasteButton.append(buildActionIcon("paste"));
  const pasteLabel = document.createElement("span");
  pasteLabel.className = "button__label";
  pasteLabel.textContent = "Paste from Clipboard";
  pasteButton.appendChild(pasteLabel);

  const manualInput = document.createElement("div");
  manualInput.className = "quick-share__manual";
  manualInput.append(input, submitButton);

  form.append(pasteButton, manualInput);

  const actions = document.createElement("div");
  actions.className = "quick-share__actions";
  actions.append(
    buildQuickShareButton("pick-file", "image", "Image", "image"),
    buildQuickShareButton("pick-file", "album", "Album", "album"),
    buildQuickShareButton("pick-file", "file", "File", "file"),
    buildQuickShareButton("pick-file", "video", "Video", "video")
  );

  const dropHint = document.createElement("div");
  dropHint.className = "quick-share__drop-hint";
  dropHint.append(buildActionIcon("drop"));
  const dropText = document.createElement("span");
  dropText.textContent = "Drag and drop files, images, or videos anywhere to send";
  dropHint.appendChild(dropText);

  container.append(form, actions, dropHint, buildPickerInput("image", "image/*"), buildPickerInput("album", "image/*"), buildPickerInput("file"), buildPickerInput("video", "video/*"));

  return container;
}

function buildQuickShareButton(
  action: string,
  picker: string | undefined,
  label: string,
  iconKind: "text" | "image" | "album" | "file" | "video"
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button button--secondary button--icon ${picker === "album" ? "button--mobile-only" : ""}`;
  button.dataset.action = action;
  if (picker) {
    button.dataset.picker = picker;
  }
  button.append(buildQuickShareIcon(iconKind));

  const labelNode = document.createElement("span");
  labelNode.className = "button__label";
  labelNode.textContent = label;
  button.appendChild(labelNode);

  return button;
}

function buildQuickShareIcon(kind: "text" | "image" | "album" | "file" | "video"): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.className = `quick-action-icon quick-action-icon--${kind}`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (kind === "text") {
    svg.innerHTML = `<path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  } else if (kind === "image") {
    svg.innerHTML = `
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="15.5" cy="9.5" r="1.5" fill="currentColor"/>
      <path d="M7 16l3.5-3.5L13 15l2-2 2 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `;
  } else if (kind === "album") {
    svg.innerHTML = `
      <rect x="6" y="5" width="11" height="13" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
      <rect x="9" y="8" width="11" height="13" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
    `;
  } else if (kind === "video") {
    svg.innerHTML = `
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M11 10l4 2-4 2z" fill="currentColor"/>
    `;
  } else {
    svg.innerHTML = `
      <path d="M8 4h6l4 4v12H8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
      <path d="M14 4v4h4" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
    `;
  }

  wrapper.appendChild(svg);
  return wrapper;
}

/**
 * Provides consistent iconography for card actions and the top-level settings affordance.
 */
function buildActionIcon(kind: "copy" | "preview" | "open" | "save" | "paste" | "settings" | "drop"): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.className = `action-icon action-icon--${kind}`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  if (kind === "copy") {
    svg.innerHTML = `
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
    `;
  } else if (kind === "preview") {
    svg.innerHTML = `
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    `;
  } else if (kind === "open") {
    svg.innerHTML = `
      <path d="M14 5h5v5M10 14l9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" stroke="currentColor" stroke-width="2" fill="none"/>
    `;
  } else if (kind === "save") {
    svg.innerHTML = `
      <path d="M12 4v10M8 10l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M5 18h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (kind === "paste") {
    svg.innerHTML = `
      <rect x="7" y="5" width="10" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M9 5.5h6M10 3h4a1 1 0 0 1 1 1v2H9V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
    `;
  } else if (kind === "settings") {
    svg.innerHTML = `
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="2" fill="none"/>
    `;
  } else {
    svg.innerHTML = `
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M5 5h3M5 5v3M19 5h-3M19 5v3M5 19h3M5 19v-3M19 19h-3M19 19v-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    `;
  }

  wrapper.appendChild(svg);
  return wrapper;
}

function buildPickerInput(picker: string, accept?: string): HTMLInputElement {
  const input = document.createElement("input");
  input.hidden = true;
  input.type = "file";
  input.dataset.role = "picker-input";
  input.dataset.picker = picker;
  if (accept) {
    input.accept = accept;
  }
  return input;
}

function buildSourceBadge(item: DataItemCardViewModel): HTMLElement {
  const badge = document.createElement("div");
  badge.className = "source-badge";
  const title = document.createElement("span");
  title.className = "source-badge__title";
  title.textContent = `${item.sourceName} · ${item.sourceIp}`;
  badge.append(buildSourceIcon(item.sourceName), title);
  return badge;
}

function buildSourceIcon(sourceName: string): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.className = "source-badge__icon";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  const normalizedSourceName = sourceName.toLowerCase();
  if (normalizedSourceName.includes("iphone") || normalizedSourceName.includes("ipad")) {
    svg.innerHTML = `
      <rect x="8" y="3" width="8" height="18" rx="2.5" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="12" cy="17.5" r="1" fill="currentColor"/>
    `;
  } else if (normalizedSourceName.includes("macos")) {
    svg.innerHTML = `
      <rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M9 20h6M8 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (normalizedSourceName.includes("windows")) {
    svg.innerHTML = `
      <path d="M4 5l7-1v8H4zM13 3.8l7-1.1V12h-7zM4 13h7v8l-7-1zM13 13h7v9.1l-7-1.1z" fill="currentColor"/>
    `;
  } else if (normalizedSourceName.includes("android")) {
    svg.innerHTML = `
      <rect x="7" y="8" width="10" height="9" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M9 6l-1-2M15 6l1-2M9 19v2M15 19v2M6 10v6M18 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="10" cy="11" r="1" fill="currentColor"/><circle cx="14" cy="11" r="1" fill="currentColor"/>
    `;
  } else {
    svg.innerHTML = `
      <rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M9 20h6M8 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `;
  }

  wrapper.appendChild(svg);
  return wrapper;
}

type ActionDefinition = {
  name: "copy" | "preview" | "open" | "save";
  label: string;
  primary: boolean;
  disabled: boolean;
};
