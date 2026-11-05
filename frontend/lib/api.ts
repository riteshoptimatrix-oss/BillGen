/**
 * Dynamic API URL resolver and secure authentication utility.
 * When the app is accessed on mobile / LAN (e.g. http://192.168.1.14:3000),
 * it dynamically targets http://192.168.1.14:8000/api instead of trying to hit localhost
 * on the mobile device itself.
 */
export function getApiUrl(): string {
  // If NEXT_PUBLIC_API_URL is configured (e.g. deployed to Netlify), use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL.trim();
    if (!envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
  }

  // Fallback for local LAN / mobile testing during local development
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
    if (isPrivateIp) {
      return `http://${hostname}:8000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
}

/**
 * Adjusts image and file URLs that point to localhost so they load properly on mobile/LAN devices.
 */
export function formatImageUrl(url?: string): string {
  if (!url) return "";
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
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
