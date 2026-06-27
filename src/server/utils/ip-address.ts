import type { Request } from "express";

/**
 * Resolves the best available client IP address, preferring forwarded headers when present.
 */
export function getRequestIpAddress(request: Request): string {
  const forwardedHeader = request.headers["x-forwarded-for"];
  if (typeof forwardedHeader === "string" && forwardedHeader.length > 0) {
    return forwardedHeader.split(",")[0]?.trim() ?? "unknown";
  }

  return request.socket.remoteAddress ?? "unknown";
}
