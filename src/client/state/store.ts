import type {
  DataCreatedEvent,
  DeviceConnectedEvent,
  DeviceListEvent,
  DeviceListItem,
  DeviceOfflineEvent
} from "../../shared/index.js";

type ApplicationState = {
  devicesById: Map<string, DeviceListItem>;
};

type StateListener = (state: ApplicationState) => void;

/**
 * Central client-side state container.
 *
 * It receives transport events, mutates a single in-memory view model, and notifies the
 * renderer without letting DOM code own business state.
 */
export class ApplicationStore {
  private readonly state: ApplicationState = {
    devicesById: new Map()
  };

  private readonly listeners = new Set<StateListener>();

  /**
   * Registers a render listener and immediately emits the current snapshot.
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Replaces the full device map with the authoritative snapshot from the server.
   */
  applyDeviceList(event: DeviceListEvent): void {
    this.state.devicesById = new Map(event.devices.map((device) => [device.deviceId, device]));
    this.notify();
  }

  /**
   * Adds a newly online device to the local view model.
   */
  applyDeviceConnected(event: DeviceConnectedEvent): void {
    const existingDevice = this.state.devicesById.get(event.device.deviceId);
    this.state.devicesById.set(
      event.device.deviceId,
      existingDevice
        ? {
            ...event.device,
            data: existingDevice.data
          }
        : event.device
    );
    this.notify();
  }

  /**
   * Marks a device as offline while preserving its visible history in the current page session.
   */
  applyDeviceOffline(event: DeviceOfflineEvent): void {
    const device = this.state.devicesById.get(event.deviceId);
    if (!device) {
      return;
    }

    this.state.devicesById.set(event.deviceId, {
      ...device,
      status: "offline",
      data: device.data.map((item) =>
        item.inline
          ? item
          : {
              ...item,
              available: false
            }
      )
    });
    this.notify();
  }

  /**
   * Prepends a newly created item to the matching device timeline and enforces the UI-side cap.
   */
  applyDataCreated(event: DataCreatedEvent): void {
    const device = this.state.devicesById.get(event.deviceId);
    if (!device) {
      return;
    }

    this.state.devicesById.set(event.deviceId, {
      ...device,
      data: [event.data, ...device.data].slice(0, 5)
    });
    this.notify();
  }

  /**
   * Emits a defensive snapshot so listeners never mutate the internal store state by accident.
   */
  private notify(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /**
   * Creates a shallow immutable view of the current application state.
   */
  private snapshot(): ApplicationState {
    return {
      devicesById: new Map(this.state.devicesById)
    };
  }
}
