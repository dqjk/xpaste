/**
 * Derives a human-readable device name from the browser user agent.
 */
export function buildDisplayName(userAgent: string | undefined): string {
  if (!userAgent) {
    return "Unknown Device";
  }

  const normalizedUserAgent = userAgent.toLowerCase();
  const platformName = resolvePlatformName(normalizedUserAgent);
  const browserName = resolveBrowserName(normalizedUserAgent);

  return `${platformName} ${browserName}`.trim();
}

/**
 * Maps a user agent string to a coarse platform label for UI display.
 */
function resolvePlatformName(userAgent: string): string {
  if (userAgent.includes("iphone")) {
    return "iPhone";
  }
  if (userAgent.includes("ipad")) {
    return "iPad";
  }
  if (userAgent.includes("android")) {
    return "Android";
  }
  if (userAgent.includes("mac os x") || userAgent.includes("macintosh")) {
    return "macOS";
  }
  if (userAgent.includes("windows")) {
    return "Windows";
  }
  if (userAgent.includes("linux")) {
    return "Linux";
  }

  return "Unknown";
}

/**
 * Maps a user agent string to a coarse browser label for UI display.
 */
function resolveBrowserName(userAgent: string): string {
  if (userAgent.includes("edg/")) {
    return "Edge";
  }
  if (userAgent.includes("chrome/")) {
    return "Chrome";
  }
  if (userAgent.includes("firefox/")) {
    return "Firefox";
  }
  if (userAgent.includes("safari/") && !userAgent.includes("chrome/")) {
    return "Safari";
  }

  return "Browser";
}
