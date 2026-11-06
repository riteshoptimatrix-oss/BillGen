const PRODUCTION_API_URL = "https://billgen-32uc.onrender.com/api";
const PRODUCTION_SERVER_ORIGIN = "https://billgen-32uc.onrender.com";

/**
 * Dynamic API URL resolver and secure authentication utility.
 * When the app is accessed on mobile / LAN (e.g. http://192.168.1.14:3000),
 * it dynamically targets http://192.168.1.14:8000/api.
 * In production (Netlify or custom domain), it targets the live Render backend.
 */
export function getApiUrl(): string {
  // 1. If running in the browser:
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);

    // If deployed on Netlify or any public domain (not localhost and not private LAN IP)
    if (!isLocalhost && !isPrivateIp) {
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
        return process.env.NEXT_PUBLIC_API_URL.trim();
      }
      return PRODUCTION_API_URL;
    }

    // Local LAN / mobile testing
    if (isPrivateIp) {
      return `http://${hostname}:8000/api`;
    }
  }

  // 2. If explicitly configured in environment variables and points to a remote server
  if (process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL.trim();
    if (!envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
}

/**
 * Adjusts image and file URLs that point to localhost so they load properly on mobile/LAN devices and production.
 */
export function formatImageUrl(url?: string): string {
  if (!url) return "";
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);

    // In production (Netlify), replace localhost URLs with production backend URL
    if (!isLocalhost && !isPrivateIp) {
      return url
        .replace("http://localhost:8000", PRODUCTION_SERVER_ORIGIN)
        .replace("http://127.0.0.1:8000", PRODUCTION_SERVER_ORIGIN);
    }

    if (isPrivateIp) {
      return url.replace("://localhost:", `://${hostname}:`).replace("://127.0.0.1:", `://${hostname}:`);
    }
  }
  return url;
}

/**
 * Auth Token Management (Session Token Storage)
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token") || null;
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("isAuthenticated", "true");
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("isAuthenticated");
  }
}

/**
 * Validates JWT token structure and expiration timestamp
 */
export function isTokenValid(token: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false; // Token expired
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Global Secure Fetch Interceptor
 * Transparently attaches Bearer JWT authorization headers and credentials to all API calls.
 */
export function setupSecureFetchInterceptor(): void {
  if (typeof window === "undefined") return;
  if ((window as any).__secureFetchPatched) return;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(init.headers || {});

    // Attach token if available and not already set
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const secureInit: RequestInit = {
      ...init,
      headers,
      credentials: init.credentials || "include",
    };

    const response = await originalFetch(input, secureInit);

    // If an authenticated endpoint returns 401 Unauthorized, automatically redirect to login
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      typeof input === "string" &&
      input.includes("/api/")
    ) {
      clearAuthToken();
      window.location.href = "/login";
    }

    return response;
  };

  (window as any).__secureFetchPatched = true;
}
