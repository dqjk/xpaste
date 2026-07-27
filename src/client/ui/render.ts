import type { Translator } from "../i18n/locale.js";
import type { ApplicationViewModel, DataItemCardViewModel } from "../state/view-model.js";

/**
 * Re-renders the whole application view from a plain view model.
 */
export function renderApplication(
  rootElement: HTMLElement,
  viewModel: ApplicationViewModel,
  translate: Translator
): void {
  rootElement.replaceChildren(buildLayout(viewModel, translate));
  updateTextOverflowControls(rootElement);
}

/**
 * Keeps text expansion controls synchronized with responsive card width changes.
 */
export function observeTextOverflow(rootElement: HTMLElement): void {
  const observer = new ResizeObserver(() => {
    updateTextOverflowControls(rootElement);
  });
  observer.observe(rootElement);
}

/**
 * Builds the responsive page shell from state-only data.
 */
function buildLayout(viewModel: ApplicationViewModel, translate: Translator): HTMLElement {
  const page = document.createElement("main");
  page.className = "page";

  const gridSection = document.createElement("section");
  gridSection.className = "items";

  const gridHeader = document.createElement("div");
  gridHeader.className = "items__header";
  const gridTitle = document.createElement("h2");
  gridTitle.textContent = translate("items.heading");
  gridHeader.appendChild(gridTitle);

  const itemGrid = document.createElement("div");
  itemGrid.className = "item-grid";
  for (const item of viewModel.items) {
    itemGrid.appendChild(buildDataItemCard(item, translate));
  }
  gridSection.append(gridHeader, itemGrid);

  page.append(buildPageHeader(), buildQuickShareBlock(translate), gridSection);
  return page;
}

/**
 * Builds the lightweight page identity row without controls or settings.
 */
function buildPageHeader(): HTMLElement {
  const header = document.createElement("header");
  header.className = "page-header";

  const wordmark = document.createElement("span");
  wordmark.className = "page-header__wordmark";
  wordmark.textContent = "xpaste";

  header.appendChild(wordmark);
  return header;
}

/**
 * Builds a single content card with preview, source identity, and direct actions.
 */
function buildDataItemCard(item: DataItemCardViewModel, translate: Translator): HTMLElement {
  const article = document.createElement("article");
  article.className = `data-item data-item--${item.kind}${item.available ? "" : " data-item--unavailable"}`;

  const body = document.createElement("div");
  body.className = "data-item__body";

  const summary = document.createElement("div");
  summary.className = "data-item__summary";

  const summaryText = document.createElement("div");
  summaryText.className = "data-item__summary-text";

  if (item.kind === "text" && item.inline) {
    summaryText.appendChild(buildExpandableText(item, translate));
  } else {
    const titleRow = document.createElement("div");
    titleRow.className = "data-item__title-row";
    const title = document.createElement("h3");
    title.textContent = item.title;
    titleRow.append(title, buildAvailabilityBadge(item, translate));

    summaryText.appendChild(titleRow);
    if (item.kind !== "file") {
      const previewText = document.createElement("p");
      previewText.textContent = item.preview;
      summaryText.appendChild(previewText);
    }
  }
  summary.appendChild(summaryText);
  body.appendChild(summary);

  if (item.kind === "image" || item.kind === "video" || item.kind === "file") {
    const preview = buildResourceTrigger("open", item, translate);
    preview.className = `data-item__preview data-item__preview--${item.kind}`;
    if (item.kind === "image" && item.available) {
      preview.appendChild(buildImagePreview(item));
    } else if (item.kind === "file") {
      preview.appendChild(buildFilePreviewArtwork());
    }

    const openLabel = document.createElement("span");
    openLabel.className = "data-item__preview-open";
    openLabel.append(buildActionIcon("open"));
    const openText = document.createElement("span");
    openText.textContent = translate("action.open");
    openLabel.appendChild(openText);
    preview.appendChild(openLabel);
    body.appendChild(preview);
  }

  const actions = document.createElement("div");
  actions.className = "data-item__actions";
  for (const action of buildActionDefinitions(item, translate)) {
    actions.appendChild(buildCardActionButton(item, action));
  }

  const footer = document.createElement("footer");
  footer.className = "data-item__footer";
  footer.append(buildSourceBadge(item), buildFooterMeta(item));

  article.append(body, actions, footer);
  return article;
}

/**
 * Creates an accessible content-area trigger for resource previews and file opening.
 */
function buildResourceTrigger(
  action: "open",
  item: DataItemCardViewModel,
  translate: Translator
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.dataset.dataId = item.dataId;
  button.disabled = !item.available;
  button.setAttribute("aria-label", `${translate(`action.${action}`)} ${item.title}`);
  return button;
}

/**
 * Uses the shared image resource itself as the card thumbnail.
 */
function buildImagePreview(item: DataItemCardViewModel): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "data-item__preview-image";
  image.src = buildResourcePath(item);
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener(
    "error",
    () => {
      image.remove();
    },
    { once: true }
  );
  return image;
}

/**
 * Builds the dependency-free generic document artwork used by every file card.
 */
function buildFilePreviewArtwork(): HTMLElement {
  const artwork = document.createElement("span");
  artwork.className = "data-item__file-artwork";
  artwork.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 104 118");
  svg.innerHTML = `
    <path d="M19 19C19 12.3726 24.3726 7 31 7H68L89 28V99C89 105.627 83.6274 111 77 111H31C24.3726 111 19 105.627 19 99V19Z" fill="currentColor" stroke="currentColor" stroke-width="3"/>
    <path d="M68 7V28H89" class="data-item__file-fold" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 48H74M32 62H66M32 75H70M32 88H59" class="data-item__file-lines" stroke-width="5" stroke-linecap="round"/>
  `;
  artwork.appendChild(svg);
  return artwork;
}

/**
 * Builds the stable resource URL without coupling rendering to the fetch client.
 */
function buildResourcePath(item: DataItemCardViewModel): string {
  return `/data/${encodeURIComponent(item.deviceId)}/${encodeURIComponent(item.dataId)}`;
}

/**
 * Builds the content-first inline text presentation without a duplicate title or subtitle.
 */
function buildExpandableText(item: DataItemCardViewModel, translate: Translator): HTMLElement {
  const container = document.createElement("div");
  container.className = "data-item__inline-text";
  container.dataset.expanded = "false";

  const content = document.createElement("p");
  content.className = "data-item__text-content";
  content.dataset.role = "text-content";
  content.tabIndex = -1;
  content.textContent = item.preview;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "data-item__text-toggle";
  toggle.dataset.action = "toggle-text";
  toggle.dataset.collapsedLabel = translate("text.showMore");
  toggle.dataset.expandedLabel = translate("text.showLess");
  toggle.textContent = translate("text.showMore");
  toggle.hidden = true;

  container.append(content, toggle);
  return container;
}

/**
 * Selects the actions that are valid for each resource type.
 */
function buildActionDefinitions(item: DataItemCardViewModel, translate: Translator): ActionDefinition[] {
  if (item.kind === "text") {
    return [
      {
        name: "copy",
        label: translate("action.copy"),
        primary: true,
        disabled: false
      }
    ];
  }

  const unavailable = !item.available;
  return [
    {
      name: "save",
      label: translate("action.save"),
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
      <path d="M7.5 7h9M12 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
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

function buildAvailabilityBadge(item: DataItemCardViewModel, translate: Translator): HTMLElement {
  const badge = document.createElement("span");
  badge.className = `availability-badge${item.available ? "" : " availability-badge--muted"}`;
  badge.textContent = item.available ? translate("status.available") : translate("status.unavailable");
  return badge;
}

function buildFooterMeta(item: DataItemCardViewModel): HTMLElement {
  const meta = document.createElement("div");
  meta.className = "data-item__footer-meta";
  meta.appendChild(buildIcon(item.kind));
  return meta;
}

function buildQuickShareBlock(translate: Translator): HTMLElement {
  const container = document.createElement("section");
  container.className = "quick-share";

  const form = document.createElement("form");
  form.className = "quick-share__form";
  form.dataset.role = "text-form";

  const input = document.createElement("input");
  input.dataset.role = "text-input";
  input.name = "text";
  input.type = "text";
  input.placeholder = translate("quick.inputPlaceholder");

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "button button--secondary";
  submitButton.textContent = translate("quick.send");

  const manualInput = document.createElement("div");
  manualInput.className = "quick-share__manual";
  manualInput.append(input, submitButton);

  form.appendChild(manualInput);

  const actions = document.createElement("div");
  actions.className = "quick-share__actions";
  actions.append(
    buildQuickShareButton("pick-file", "image", translate("quick.image"), "image"),
    buildQuickShareButton("pick-file", "file", translate("quick.file"), "file"),
    buildQuickShareButton("pick-file", "video", translate("quick.video"), "video")
  );

  const dropHint = document.createElement("div");
  dropHint.className = "quick-share__drop-hint";
  dropHint.append(buildActionIcon("drop"));
  const dropText = document.createElement("span");
  dropText.textContent = translate("quick.dropHint");
  dropHint.appendChild(dropText);

  container.append(form, actions, dropHint, buildPickerInput("image", "image/*"), buildPickerInput("file"), buildPickerInput("video", "video/*"));

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
 * Provides consistent iconography for card and Quick Share actions.
 */
function buildActionIcon(kind: "copy" | "open" | "save" | "drop"): HTMLElement {
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
  } else {
    svg.innerHTML = `
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M5 5h3M5 5v3M19 5h-3M19 5v3M5 19h3M5 19v-3M19 19h-3M19 19v-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    `;
  }

  wrapper.appendChild(svg);
  return wrapper;
}

/**
 * Creates the native file picker used by Quick Share buttons.
 *
 * The input is visually hidden instead of using `hidden`/`display: none` because
 * some browsers block programmatic file chooser opening for fully hidden inputs.
 */
function buildPickerInput(picker: string, accept?: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.className = "file-picker-input";
  input.dataset.role = "picker-input";
  input.dataset.picker = picker;
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
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
  name: "copy" | "open" | "save";
  label: string;
  primary: boolean;
  disabled: boolean;
};

/**
 * Shows expansion controls only when the collapsed text actually exceeds three rendered lines.
 */
function updateTextOverflowControls(rootElement: HTMLElement): void {
  for (const container of rootElement.querySelectorAll<HTMLElement>(".data-item__inline-text")) {
    const content = container.querySelector<HTMLElement>("[data-role='text-content']");
    const toggle = container.querySelector<HTMLButtonElement>(".data-item__text-toggle");
    if (!content || !toggle) {
      continue;
    }

    if (container.dataset.expanded === "true") {
      toggle.hidden = false;
      continue;
    }

    toggle.hidden = content.scrollHeight <= content.clientHeight + 1;
  }
}
