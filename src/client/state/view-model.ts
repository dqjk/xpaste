import type { DeviceListItem, SharedItemSummary } from "../../shared/index.js";

export type DataItemCardViewModel = {
  deviceId: string;
  dataId: string;
  kind: SharedItemSummary["kind"];
  createdAt: number;
  inline: boolean;
  available: boolean;
  mimeType: string;
  size: number;
  timeLabel: string;
  title: string;
  preview: string;
  sourceName: string;
  sourceIp: string;
};

export type ApplicationViewModel = {
  items: DataItemCardViewModel[];
};

/**
 * Converts the device-centric runtime state into the content-first view model used by the UI.
 */
export function buildApplicationViewModel(devices: DeviceListItem[]): ApplicationViewModel {
  const items = devices
    .flatMap((device) =>
      device.data.map((item) => {
        const timeLabel = formatItemTime(item.createdAt);
        return {
          deviceId: device.deviceId,
          dataId: item.dataId,
          kind: item.kind,
          createdAt: item.createdAt,
          inline: item.inline,
          available: item.available,
          mimeType: item.mimeType,
          size: item.size,
          timeLabel,
          title: buildItemTitle(item),
          preview: buildItemPreview(item, timeLabel),
          sourceName: device.displayName,
          sourceIp: device.ip
        };
      })
    )
    .sort((left, right) => {
      if (left.available !== right.available) {
        return Number(right.available) - Number(left.available);
      }

      return right.createdAt - left.createdAt;
    });

  return { items };
}

function buildItemTitle(item: SharedItemSummary): string {
  if (item.kind === "text") {
    return "";
  }

  return item.name ?? `${item.kind.charAt(0).toUpperCase()}${item.kind.slice(1)}`;
}

function buildItemPreview(item: SharedItemSummary, timeLabel: string): string {
  if (item.kind === "text" && "text" in item.summary) {
    return item.summary.text;
  }

  return `${formatFileSize(item.size)} · ${timeLabel}`;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats an item's creation time in the browser's local timezone with second-level precision.
 */
function formatItemTime(createdAt: number): string {
  const date = new Date(createdAt);
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}
