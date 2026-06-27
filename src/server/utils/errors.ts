import type { Response } from "express";

/**
 * Sends a consistent 400 response for malformed client requests.
 */
export function sendBadRequest(response: Response, message: string): void {
  response.status(400).json({ error: message });
}

/**
 * Sends a consistent 404 response for missing devices or shared items.
 */
export function sendNotFound(response: Response, message: string): void {
  response.status(404).json({ error: message });
}

/**
 * Sends a consistent 413 response when payload limits are exceeded.
 */
export function sendPayloadTooLarge(response: Response, message: string): void {
  response.status(413).json({ error: message });
}

/**
 * Detects request-parser limit failures without coupling the application boundary to parser classes.
 */
export function isTransportPayloadTooLargeError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  const type = "type" in error ? error.type : undefined;
  return code === "LIMIT_FILE_SIZE" || type === "entity.too.large";
}
