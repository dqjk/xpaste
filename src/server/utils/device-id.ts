import type { Request } from "express";

const DEVICE_ID_COOKIE_NAME = "deviceId";

/**
 * Reads the stable device id cookie from the incoming request.
 */
export function getDeviceIdFromRequest(request: Request): string | null {
  const headerValue = request.headers.cookie;
  if (typeof headerValue !== "string" || headerValue.length === 0) {
    return null;
  }

  const cookieEntries = headerValue.split(";");
  for (const entry of cookieEntries) {
    const [rawName, rawValue] = entry.split("=");
    if (rawName?.trim() === DEVICE_ID_COOKIE_NAME) {
      return decodeURIComponent(rawValue?.trim() ?? "");
    }
  }

  return null;
}
