import axios from "axios";

export const TOKEN_KEY = "opc_admin_token";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  timeout: 10000
});

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAssetUrl(path?: string | null) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const apiBase = adminApi.defaults.baseURL || "http://127.0.0.1:8000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getSiteAssetUrl(path?: string | null) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const configuredSiteBase = import.meta.env.VITE_SITE_BASE_URL;
  if (configuredSiteBase) {
    try {
      const configuredUrl = new URL(configuredSiteBase);
      if (typeof window !== "undefined") {
        const isConfiguredLocalhost = new Set(["localhost", "127.0.0.1"]).has(configuredUrl.hostname);
        const isCurrentLocalhost = new Set(["localhost", "127.0.0.1"]).has(window.location.hostname);
        if (isConfiguredLocalhost && !isCurrentLocalhost) {
          const siteBase = `${window.location.protocol}//${window.location.hostname}`;
          return `${siteBase}${path.startsWith("/") ? path : `/${path}`}`;
        }
      }
    } catch {
      // Ignore malformed configured site base and fall back below.
    }

    const siteBase = trimTrailingSlash(configuredSiteBase);
    return `${siteBase}${path.startsWith("/") ? path : `/${path}`}`;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const localHosts = new Set(["localhost", "127.0.0.1"]);
    const siteBase = localHosts.has(hostname) ? `${protocol}//${hostname}:3000` : `${protocol}//${hostname}`;
    return `${siteBase}${path.startsWith("/") ? path : `/${path}`}`;
  }

  return path;
}

export function getCmsImageUrl(path?: string | null) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (path.includes("/uploads/")) {
    return getAssetUrl(path);
  }

  return getSiteAssetUrl(path);
}

export async function downloadAuthorizedFile(path: string, fileName: string) {
  const response = await adminApi.get(path, { responseType: "blob" });
  const blob = new Blob([response.data]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
