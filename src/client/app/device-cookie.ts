const DEVICE_ID_COOKIE_NAME = "deviceId";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type DeviceIdCrypto = Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">>;

/**
 * Ensures the browser has a stable device id cookie before any API or SSE request is made.
 */
export function ensureDeviceIdCookie(): string {
  const existingDeviceId = readCookieValue(DEVICE_ID_COOKIE_NAME);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const createdDeviceId = createDeviceId(globalThis.crypto);
  document.cookie = `${DEVICE_ID_COOKIE_NAME}=${encodeURIComponent(createdDeviceId)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  return createdDeviceId;
}

/**
 * Creates a UUID v4 in both secure and insecure browser contexts.
 *
 * `Crypto.randomUUID` is restricted to secure contexts in some browsers. LAN clients commonly
 * use plain HTTP, where `getRandomValues` remains available and supplies the same secure entropy.
 */
export function createDeviceId(cryptoSource: DeviceIdCrypto): string {
  if (typeof cryptoSource.randomUUID === "function") {
    return cryptoSource.randomUUID();
  }

  const bytes = cryptoSource.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
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
