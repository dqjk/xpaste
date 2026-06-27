import type { DeviceListEvent, DeviceListItem, DeviceOfflineEvent } from "../../shared/index.js";
import { buildDisplayName } from "../utils/device-name.js";

type DeviceRecord = {
  deviceId: string;
  displayName: string;
  ip: string;
  connectedAt: number;
  connectionIds: Set<string>;
};

export type DeviceConnectionContext = {
  connectionId: string;
  deviceId: string;
  ip: string;
  userAgent: string | undefined;
};

/**
 * Aggregates multiple SSE sessions under one logical device id.
 *
 * A device stays online as long as at least one connection for that device remains open.
 */
export class DeviceService {
  private readonly devices = new Map<string, DeviceRecord>();

  /**
   * Registers a new SSE session under its device id.
   *
   * When the device is seen for the first time, a new device record is created.
   * Additional tabs for the same device id only extend the connection set.
   */
  addConnection(context: DeviceConnectionContext): { device: DeviceListItem; isNewDevice: boolean } {
    const existingDevice = this.devices.get(context.deviceId);
    if (existingDevice) {
      existingDevice.connectionIds.add(context.connectionId);
      return {
        device: this.toDeviceListItem(existingDevice),
        isNewDevice: false
      };
    }

    const createdAt = Date.now();
    const device: DeviceRecord = {
      deviceId: context.deviceId,
      displayName: buildDisplayName(context.userAgent),
      ip: context.ip,
      connectedAt: createdAt,
      connectionIds: new Set([context.connectionId])
    };

    this.devices.set(context.deviceId, device);
    return {
      device: this.toDeviceListItem(device),
      isNewDevice: true
    };
  }

  /**
   * Removes a single SSE session.
   *
   * When the last session disappears, the owning device is considered offline and the
   * caller can trigger device cleanup and broadcast the offline event.
   */
  removeConnection(connectionId: string): { removedDeviceId: string | null; offlineEvent: DeviceOfflineEvent | null } {
    for (const device of this.devices.values()) {
      if (!device.connectionIds.has(connectionId)) {
        continue;
      }

      device.connectionIds.delete(connectionId);
      if (device.connectionIds.size > 0) {
        return { removedDeviceId: null, offlineEvent: null };
      }

      this.devices.delete(device.deviceId);
      return {
        removedDeviceId: device.deviceId,
        offlineEvent: {
          type: "device-offline",
          deviceId: device.deviceId,
          offlineAt: Date.now()
        }
      };
    }

    return { removedDeviceId: null, offlineEvent: null };
  }

  /**
   * Builds the full device snapshot sent to a newly connected client.
   */
  buildDeviceListEvent(deviceDataMap: Map<string, DeviceListItem["data"]>): DeviceListEvent {
    const devices = Array.from(this.devices.values()).map((device) => {
      const item = this.toDeviceListItem(device);
      item.data = deviceDataMap.get(device.deviceId) ?? [];
      return item;
    });

    return {
      type: "device-list",
      devices
    };
  }

  /**
   * Checks whether the device is currently represented by at least one active session.
   */
  hasDevice(deviceId: string): boolean {
    return this.devices.has(deviceId);
  }

  /**
   * Converts the internal mutable device record into a transport-safe snapshot.
   */
  private toDeviceListItem(device: DeviceRecord): DeviceListItem {
    return {
      deviceId: device.deviceId,
      displayName: device.displayName,
      ip: device.ip,
      status: "online",
      connectedAt: device.connectedAt,
      data: []
    };
  }
}
