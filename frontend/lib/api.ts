/**
 * Dynamic API URL resolver.
 * When the app is accessed on mobile / LAN (e.g. http://192.168.1.14:3000),
 * it dynamically targets http://192.168.1.14:8000/api instead of trying to hit localhost
 * on the mobile device itself.
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
}

/**
 * Adjusts image URLs that point to localhost so they load properly on mobile/LAN devices.
 */
export function formatImageUrl(url?: string): string {
  if (!url) return "";
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return url.replace("://localhost:", `://${hostname}:`).replace("://127.0.0.1:", `://${hostname}:`);
    }
  }
  return url;
}

