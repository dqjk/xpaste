import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import type { DeviceConnectedEvent } from "../../shared/index.js";
import { DataService } from "../services/data-service.js";
import { DeviceService } from "../services/device-service.js";
import { SseService } from "../services/sse-service.js";
import { getDeviceIdFromRequest } from "../utils/device-id.js";
import { sendBadRequest } from "../utils/errors.js";
import { getRequestIpAddress } from "../utils/ip-address.js";

type RegisterEventRoutesOptions = {
  app: Express;
  deviceService: DeviceService;
  dataService: DataService;
  sseService: SseService;
};

/**
 * Registers the SSE endpoint that establishes online presence and streams incremental updates.
 */
export function registerEventRoutes(options: RegisterEventRoutesOptions): void {
  options.app.get("/events", (request, response) => {
    const deviceId = getDeviceIdFromRequest(request);
    if (!deviceId) {
      sendBadRequest(response, "deviceId cookie is required");
      return;
    }

    establishSseConnection(request, response);

    /**
     * A newly opened stream is first registered as a live connection, then attached to its
     * logical device, then bootstrapped with the current device list snapshot.
     */
    const connectionId = randomUUID();
    options.sseService.addConnection({
      connectionId,
      deviceId,
      response
    });

    const { device, isNewDevice } = options.deviceService.addConnection({
      connectionId,
      deviceId,
      ip: getRequestIpAddress(request),
      userAgent: request.headers["user-agent"]
    });

    options.sseService.send(connectionId, options.deviceService.buildDeviceListEvent(options.dataService.getDeviceSummaries()));

    if (isNewDevice) {
      const event: DeviceConnectedEvent = {
        type: "device-connected",
        device
      };
      options.sseService.broadcast(event);
    }

    request.on("close", () => {
      options.sseService.removeConnection(connectionId);
      const { removedDeviceId, offlineEvent } = options.deviceService.removeConnection(connectionId);
      if (!removedDeviceId || !offlineEvent) {
        return;
      }

      /**
       * Device-owned data is cleaned only after the final session disappears so multiple tabs
       * on the same device do not accidentally delete each other's runtime state.
       */
      void options.dataService.clearDeviceItems(removedDeviceId).then(() => {
        options.sseService.broadcast(offlineEvent);
      });
    });
  });
}

/**
 * Prepares an HTTP response to behave as a long-lived SSE stream.
 */
function establishSseConnection(_request: Request, response: Response): void {
  response.status(200);
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders();
}
