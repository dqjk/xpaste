import type { DeviceListItem } from "./device.js";
import type { SharedItemSummary } from "./data.js";

export type DeviceListEvent = {
  type: "device-list";
  devices: DeviceListItem[];
};

export type DeviceConnectedEvent = {
  type: "device-connected";
  device: DeviceListItem;
};

export type DeviceOfflineEvent = {
  type: "device-offline";
  deviceId: string;
  offlineAt: number;
};

export type DataCreatedEvent = {
  type: "data-created";
  deviceId: string;
  data: SharedItemSummary;
};

export type ServerEvent =
  | DeviceListEvent
  | DeviceConnectedEvent
  | DeviceOfflineEvent
  | DataCreatedEvent;
