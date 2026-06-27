import { pipeline } from "node:stream/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express, { type Express } from "express";
import multer from "multer";
import type { CreateTextDataRequest, DataCreatedEvent } from "../../shared/index.js";
import { DataService, DataTooLargeError } from "../services/data-service.js";
import { DeviceService } from "../services/device-service.js";
import { SseService } from "../services/sse-service.js";
import { getDeviceIdFromRequest } from "../utils/device-id.js";
import { sendBadRequest, sendNotFound, sendPayloadTooLarge } from "../utils/errors.js";

const upload = multer({
  dest: join(tmpdir(), "xpaste-upload")
});

type RegisterDataRoutesOptions = {
  app: Express;
  deviceService: DeviceService;
  dataService: DataService;
  sseService: SseService;
};

/**
 * Registers upload and resource-read endpoints for shared data.
 */
export function registerDataRoutes(options: RegisterDataRoutesOptions): void {
  options.app.post("/data", express.json(), upload.single("file"), async (request, response, next) => {
    const deviceId = getDeviceIdFromRequest(request);
    if (!deviceId) {
      sendBadRequest(response, "deviceId cookie is required");
      return;
    }

    if (!options.deviceService.hasDevice(deviceId)) {
      sendNotFound(response, "device not found");
      return;
    }

    try {
      /**
       * The request shape determines which creation path runs:
       * JSON bodies become text items, multipart requests become binary items.
       */
      const summary = request.file
        ? await options.dataService.createBinaryItem(deviceId, request.file)
        : await options.dataService.createTextItem(deviceId, request.body as CreateTextDataRequest);

      const event: DataCreatedEvent = {
        type: "data-created",
        deviceId,
        data: summary
      };

      options.sseService.broadcast(event);
      response.status(201).json({
        ok: true,
        deviceId,
        data: summary
      });
    } catch (error) {
      if (error instanceof DataTooLargeError) {
        sendPayloadTooLarge(response, error.message);
        return;
      }

      next(error);
    }
  });

  options.app.get("/data/:deviceId/:dataId", async (request, response, next) => {
    const resource = options.dataService.getResource(request.params.deviceId, request.params.dataId);
    if (!resource) {
      sendNotFound(response, "data not found");
      return;
    }

    response.status(200);
    response.setHeader("Content-Type", resource.contentType);
    response.setHeader("Content-Length", String(resource.contentLength));
    if (resource.fileName) {
      response.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(resource.fileName)}"`);
    }

    /**
     * Resources are streamed directly instead of being buffered in memory so files and images
     * keep the same endpoint shape without expanding the process memory footprint.
     */
    try {
      await pipeline(resource.body, response);
    } catch (error) {
      next(error);
    }
  });
}
