import type { SharedItemSummary } from "./data.js";

export type DeviceStatus = "online" | "offline";

export type DeviceListItem = {
  deviceId: string;
  displayName: string;
  ip: string;
  status: DeviceStatus;
  connectedAt: number;
  data: SharedItemSummary[];
};
