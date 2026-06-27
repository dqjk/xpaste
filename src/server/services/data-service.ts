import { createReadStream, promises as fileSystem } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { CreateTextDataRequest, SharedItemKind, SharedItemSummary } from "../../shared/index.js";

const MAX_ITEMS_PER_DEVICE = 5;
const INLINE_TEXT_LIMIT = 2048;
export const MAX_TEXT_BYTES = 256 * 1024;
export const MAX_BINARY_BYTES = 20 * 1024 * 1024;

type TextItem = {
  dataId: string;
  deviceId: string;
  kind: "text";
  createdAt: number;
  mimeType: string;
  size: number;
  text: string;
};

type BinaryItem = {
  dataId: string;
  deviceId: string;
  kind: "image" | "video" | "file";
  createdAt: number;
  mimeType: string;
  size: number;
  name: string;
  filePath: string;
};

type StoredItem = TextItem | BinaryItem;

export type ResourceDescriptor = {
  contentType: string;
  contentLength: number;
  fileName: string | null;
  body: Readable;
};

/**
 * Raised when an uploaded payload exceeds the service limits agreed by client and server.
 */
export class DataTooLargeError extends Error {}

/**
 * Owns the ephemeral shared-content lifecycle for each online device.
 *
 * Text payloads stay in memory, while binary payloads are moved into the operating
 * system temp directory and referenced by metadata kept in memory.
 */
export class DataService {
  private readonly itemsByDeviceId = new Map<string, StoredItem[]>();
  private nextDataId = 1;

  /**
   * Creates a text item, validates size limits, and stores it in the device's rolling window.
   */
  async createTextItem(deviceId: string, payload: CreateTextDataRequest): Promise<SharedItemSummary> {
    if (typeof payload.text !== "string" || payload.text.trim().length === 0) {
      throw new Error("text is required");
    }

    const byteSize = Buffer.byteLength(payload.text, "utf8");
    if (byteSize > MAX_TEXT_BYTES) {
      throw new DataTooLargeError("text payload exceeds allowed limit");
    }

    const item: TextItem = {
      dataId: this.createDataId(),
      deviceId,
      kind: "text",
      createdAt: Date.now(),
      mimeType: "text/plain; charset=utf-8",
      size: byteSize,
      text: payload.text
    };

    await this.appendItem(item);
    return this.toSummary(item);
  }

  /**
   * Creates a binary item, classifies it as image or file, and moves the uploaded file
   * out of Multer's staging directory into the service-owned temp location.
   */
  async createBinaryItem(deviceId: string, file: Express.Multer.File): Promise<SharedItemSummary> {
    if (file.size > MAX_BINARY_BYTES) {
      await fileSystem.rm(file.path, { force: true });
      throw new DataTooLargeError("binary payload exceeds allowed limit");
    }

    const kind: SharedItemKind = file.mimetype.startsWith("image/")
      ? "image"
      : file.mimetype.startsWith("video/")
        ? "video"
        : "file";
    const filePath = await this.moveUploadedFile(file);
    const item: BinaryItem = {
      dataId: this.createDataId(),
      deviceId,
      kind,
      createdAt: Date.now(),
      mimeType: file.mimetype || "application/octet-stream",
      size: file.size,
      name: file.originalname,
      filePath
    };

    await this.appendItem(item);
    return this.toSummary(item);
  }

  /**
   * Produces the latest per-device summaries used by the device-list bootstrap event.
   */
  getDeviceSummaries(): Map<string, SharedItemSummary[]> {
    const result = new Map<string, SharedItemSummary[]>();
    for (const [deviceId, items] of this.itemsByDeviceId.entries()) {
      result.set(
        deviceId,
        [...items]
          .sort((left, right) => right.createdAt - left.createdAt)
          .map((item) => this.toSummary(item))
      );
    }
    return result;
  }

  /**
   * Removes all runtime data for a disconnected device and deletes any temp files it owned.
   */
  async clearDeviceItems(deviceId: string): Promise<void> {
    const items = this.itemsByDeviceId.get(deviceId);
    this.itemsByDeviceId.delete(deviceId);
    if (!items) {
      return;
    }

    const cleanupTasks = items
      .filter((item): item is BinaryItem => item.kind !== "text")
      .map((item) => fileSystem.rm(item.filePath, { force: true }));

    await Promise.all(cleanupTasks);
  }

  /**
   * Resolves a stored item into a streamable HTTP resource descriptor.
   */
  getResource(deviceId: string, dataId: string): ResourceDescriptor | null {
    const item = this.itemsByDeviceId.get(deviceId)?.find((entry) => entry.dataId === dataId);
    if (!item) {
      return null;
    }

    if (item.kind === "text") {
      return {
        contentType: item.mimeType,
        contentLength: item.size,
        fileName: null,
        body: Readable.from([item.text])
      };
    }

    return {
      contentType: item.mimeType,
      contentLength: item.size,
      fileName: item.name,
      body: createReadStream(item.filePath)
    };
  }

  /**
   * Appends a new item to a device timeline and evicts the oldest entries once the limit is exceeded.
   */
  private async appendItem(item: StoredItem): Promise<void> {
    const items = this.itemsByDeviceId.get(item.deviceId) ?? [];
    items.push(item);
    this.itemsByDeviceId.set(item.deviceId, items);

    while (items.length > MAX_ITEMS_PER_DEVICE) {
      const removedItem = items.shift();
      if (!removedItem || removedItem.kind === "text") {
        continue;
      }

      await fileSystem.rm(removedItem.filePath, { force: true });
    }
  }

  /**
   * Converts an internal stored item into the summary shape pushed over SSE and bootstrap payloads.
   */
  private toSummary(item: StoredItem): SharedItemSummary {
    if (item.kind === "text") {
      const inline = item.size <= INLINE_TEXT_LIMIT;
      const textValue = inline ? item.text : item.text.slice(0, INLINE_TEXT_LIMIT);
      return {
        dataId: item.dataId,
        kind: item.kind,
        createdAt: item.createdAt,
        inline,
        available: true,
        mimeType: item.mimeType,
        size: item.size,
        summary: inline ? { text: textValue } : { text: textValue, truncated: true }
      };
    }

    if (item.kind === "image") {
      return {
        dataId: item.dataId,
        kind: item.kind,
        createdAt: item.createdAt,
        inline: false,
        available: true,
        mimeType: item.mimeType,
        name: item.name,
        size: item.size,
        summary: {
          name: item.name,
          size: item.size,
          mimeType: item.mimeType
        }
      };
    }

    return {
      dataId: item.dataId,
      kind: item.kind,
      createdAt: item.createdAt,
      inline: false,
      available: true,
      mimeType: item.mimeType,
      name: item.name,
      size: item.size,
      summary: {
        name: item.name,
        size: item.size
      }
    };
  }

  /**
   * Allocates the next monotonically increasing data id for this process lifetime.
   */
  private createDataId(): string {
    const nextValue = this.nextDataId;
    this.nextDataId += 1;
    return `data_${nextValue.toString().padStart(4, "0")}`;
  }

  /**
   * Moves Multer's temporary upload into the xpaste temp namespace so the service controls its lifetime.
   */
  private async moveUploadedFile(file: Express.Multer.File): Promise<string> {
    const targetDirectory = join(tmpdir(), "xpaste");
    await fileSystem.mkdir(targetDirectory, { recursive: true });
    const safeName = file.originalname.replaceAll(/[^a-zA-Z0-9.-]/g, "_");
    const targetPath = join(targetDirectory, `${Date.now()}-${safeName}`);
    await fileSystem.rename(file.path, targetPath);
    return targetPath;
  }
}
