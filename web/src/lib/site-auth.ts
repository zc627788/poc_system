"use client";

import type {
  ApiResponse,
  SiteUserAuthResult,
  SiteUserLoginPayload,
  SiteUserProfile,
  SiteUserRegisterPayload,
} from "@/types";

const TOKEN_KEY = "opc_site_token";
const USER_KEY = "opc_site_user";
const AUTH_EVENT = "opc-site-auth-change";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

async function postAuth<TPayload>(path: string, payload: TPayload): Promise<SiteUserAuthResult> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as ApiResponse<SiteUserAuthResult> & { detail?: string };
  if (!response.ok || result.code !== 0) {
    throw new Error(result.detail || result.message || "Authentication failed");
  }
  saveSiteAuth(result.data);
  return result.data;
}

export function getSiteAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function getCachedSiteUser() {
  return readJson<SiteUserProfile>(USER_KEY);
}

export function saveSiteAuth(result: SiteUserAuthResult) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, result.access_token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  emitAuthChange();
}

export function clearSiteAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  emitAuthChange();
}

export async function loginSiteUser(payload: SiteUserLoginPayload) {
  return postAuth("/public/auth/login", payload);
}

export async function registerSiteUser(payload: SiteUserRegisterPayload) {
  return postAuth("/public/auth/register", payload);
}

export async function fetchCurrentSiteUser() {
  const token = getSiteAuthToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/public/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    clearSiteAuth();
    return null;
  }

  const result = (await response.json()) as ApiResponse<SiteUserProfile> & { detail?: string };
  if (!response.ok || result.code !== 0) {
    throw new Error(result.detail || result.message || "Failed to load current user");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(result.data));
  }
  return result.data;
}

export function getSiteAuthHeaders() {
  const token = getSiteAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function onSiteAuthChange(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
}
