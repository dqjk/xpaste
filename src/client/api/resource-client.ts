/**
 * Builds the resource endpoint URL for a specific shared item.
 */
export function buildResourceUrl(deviceId: string, dataId: string): string {
  return `/data/${encodeURIComponent(deviceId)}/${encodeURIComponent(dataId)}`;
}

/**
 * Opens a shared resource in a new browser tab for preview-style actions.
 */
export function openResourcePreview(deviceId: string, dataId: string): void {
  globalThis.open(buildResourceUrl(deviceId, dataId), "_blank", "noopener");
}

/**
 * Downloads a shared resource to the local device.
 */
export async function saveResource(deviceId: string, dataId: string, fileName: string): Promise<void> {
  const response = await fetch(buildResourceUrl(deviceId, dataId));
  if (!response.ok) {
    throw new Error(`resource download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

/**
 * Copies inline text to the local clipboard.
 */
export async function copyText(text: string): Promise<void> {
  const clipboard = navigator.clipboard;
  if (!globalThis.isSecureContext || !clipboard || typeof clipboard.writeText !== "function") {
    throw new Error("clipboard write is unavailable");
  }

  await clipboard.writeText(text);
}

/**
 * Fetches the complete text payload for a non-inline shared resource.
 */
export async function readResourceText(deviceId: string, dataId: string): Promise<string> {
  const response = await fetch(buildResourceUrl(deviceId, dataId));
  if (!response.ok) {
    throw new Error(`resource read failed with status ${response.status}`);
  }

  return response.text();
}
