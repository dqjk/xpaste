const DEVICE_ID_COOKIE_NAME = "deviceId";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Ensures the browser has a stable device id cookie before any API or SSE request is made.
 */
export function ensureDeviceIdCookie(): string {
  const existingDeviceId = readCookieValue(DEVICE_ID_COOKIE_NAME);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const createdDeviceId = globalThis.crypto.randomUUID();
  document.cookie = `${DEVICE_ID_COOKIE_NAME}=${encodeURIComponent(createdDeviceId)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  return createdDeviceId;
}

/**
 * Looks up a cookie value from the current document cookie string.
 */
function readCookieValue(name: string): string | null {
  const cookieEntries = document.cookie.split(";");
  for (const entry of cookieEntries) {
    const [cookieName, cookieValue] = entry.split("=");
    if (cookieName?.trim() === name) {
      return decodeURIComponent(cookieValue?.trim() ?? "");
    }
  }

  return null;
}
