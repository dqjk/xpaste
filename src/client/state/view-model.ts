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
      device.data.map((item) => ({
        deviceId: device.deviceId,
        dataId: item.dataId,
        kind: item.kind,
        createdAt: item.createdAt,
        inline: item.inline,
        available: item.available,
        mimeType: item.mimeType,
        size: item.size,
        title: buildItemTitle(item),
        preview: buildItemPreview(item),
        sourceName: device.displayName,
        sourceIp: device.ip
      }))
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

function buildItemPreview(item: SharedItemSummary): string {
  if (item.kind === "text" && "text" in item.summary) {
    return item.summary.text;
  }

  if ("name" in item.summary) {
    return `${formatFileSize(item.size)} · ${formatItemType(item)}`;
  }

  return `${formatFileSize(item.size)} · ${formatItemType(item)}`;
}

function formatItemType(item: SharedItemSummary): string {
  const fileName = item.name ?? ("name" in item.summary ? item.summary.name : "");
  const extension = fileName.split(".").pop();
  if (extension && extension !== fileName) {
    return extension.toUpperCase();
  }

  if (item.mimeType.includes("/")) {
    return item.mimeType.split("/").pop()?.toUpperCase() ?? item.kind.toUpperCase();
  }

  return item.kind.toUpperCase();
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
