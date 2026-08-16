"use client";

import type {
  ApiResponse,
  OpcApplicationDetailResponse,
  OpcApplicationDraftPayload,
  OpcApplicationDraftResponse,
  OpcApplicationDraftSaveResponse,
  OpcApplicationListResponse,
  OpcMaterialUploadItem,
  SiteUserAuthResult,
  SiteUserLoginPayload,
  SiteUserProfile,
  SiteUserRegisterPayload,
} from "@/types";

const TOKEN_KEY = "opc_site_token";
const USER_KEY = "opc_site_user";
const AUTH_EVENT = "opc-site-auth-change";
export const siteApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

function buildSiteApiUrl(path: string) {
  const normalizedBase = siteApiBaseUrl.endsWith("/") ? siteApiBaseUrl.slice(0, -1) : siteApiBaseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  if (normalizedBase.startsWith("http://") || normalizedBase.startsWith("https://")) {
    return `${normalizedBase}${normalizedPath}`;
  }
  
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000";
  return `${fallbackOrigin}${normalizedBase}${normalizedPath}`;
}

function normalizeRequestError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("failed to fetch") || message.includes("fetch failed")) {
      return new Error("无法连接后端服务，请确认 127.0.0.1:8000 已启动后重试。");
    }
    return error;
  }
  return new Error("请求失败，请稍后重试。");
}

async function readApiResponse<T>(response: Response): Promise<(ApiResponse<T> & { detail?: string }) | null> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return (await response.json()) as ApiResponse<T> & { detail?: string };
}

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
  try {
    const response = await fetch(buildSiteApiUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<SiteUserAuthResult>(response);
    if (!response.ok || !result || result.code !== 0) {
      throw new Error(result?.detail || result?.message || "Authentication failed");
    }
    saveSiteAuth(result.data);
    return result.data;
  } catch (error) {
    throw normalizeRequestError(error);
  }
}

async function getAuthorized<T>(path: string): Promise<T> {
  const token = getSiteAuthToken();
  if (!token) {
    throw new Error("请先登录后再查看我的办件。");
  }
  try {
    const response = await fetch(buildSiteApiUrl(path), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const result = await readApiResponse<T>(response);
    if (response.status === 401) {
      clearSiteAuth();
      throw new Error("登录已过期，请重新登录。");
    }
    if (!response.ok || !result || result.code !== 0) {
      throw new Error(result?.detail || result?.message || "Request failed");
    }
    return result.data;
  } catch (error) {
    throw normalizeRequestError(error);
  }
}

async function sendAuthorized<T>(path: string, init: RequestInit): Promise<T> {
  const token = getSiteAuthToken();
  if (!token) {
    throw new Error("请先登录后再继续操作。");
  }
  try {
    const response = await fetch(buildSiteApiUrl(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });

    const result = await readApiResponse<T>(response);
    if (response.status === 401) {
      clearSiteAuth();
      throw new Error("登录已过期，请重新登录。");
    }
    if (!response.ok || !result || result.code !== 0) {
      throw new Error(result?.detail || result?.message || "Request failed");
    }
    return result.data;
  } catch (error) {
    throw normalizeRequestError(error);
  }
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

export function hasSiteAuthSession() {
  const user = getCachedSiteUser();
  return Boolean(getSiteAuthToken() || user?.id);
}

export function saveSiteAuth(result: SiteUserAuthResult) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, result.access_token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  emitAuthChange();
}

export function saveSiteAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(USER_KEY);
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

export async function devLoginSiteUser() {
  return postAuth("/public/auth/dev-login", {});
}

export async function bridgeTestSiteUser(profile: SiteUserProfile) {
  return postAuth("/public/auth/test-bridge", {
    id: profile.id,
    phone: profile.phone,
    auth_source: profile.auth_source || "ixiamen",
  });
}

export async function fetchCurrentSiteUser() {
  const token = getSiteAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(buildSiteApiUrl("/public/auth/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      clearSiteAuth();
      return null;
    }

    const result = await readApiResponse<SiteUserProfile>(response);
    if (!response.ok || !result || result.code !== 0) {
      throw new Error(result?.detail || result?.message || "Failed to load current user");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_KEY, JSON.stringify(result.data));
    }
    return result.data;
  } catch (error) {
    throw normalizeRequestError(error);
  }
}

export async function uploadOpcMaterialFile(materialCategory: string, file: File): Promise<OpcMaterialUploadItem> {
  const formData = new FormData();
  formData.append("material_category", materialCategory);
  formData.append("file", file);

  return sendAuthorized<OpcMaterialUploadItem>("/public/opc-applications/materials", {
    method: "POST",
    body: formData,
  });
}

export async function deleteOpcMaterialFile(fileId: number): Promise<boolean> {
  return sendAuthorized<boolean>("/public/opc-applications/materials", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_id: fileId }),
  });
}

export async function submitOpcApplication(payload: Record<string, unknown>): Promise<{ id: number; application_no: string; status: string; submitted_at: string }> {
  return sendAuthorized<{ id: number; application_no: string; status: string; submitted_at: string }>("/public/opc-applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getOpcApplicationDraft(): Promise<OpcApplicationDraftResponse> {
  return getAuthorized<OpcApplicationDraftResponse>("/public/opc-applications/draft");
}

export async function saveOpcApplicationDraft(payload: OpcApplicationDraftPayload): Promise<OpcApplicationDraftSaveResponse> {
  return sendAuthorized<OpcApplicationDraftSaveResponse>("/public/opc-applications/draft", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function clearOpcApplicationDraft(): Promise<{ ok: boolean }> {
  return sendAuthorized<{ ok: boolean }>("/public/opc-applications/draft/clear", {
    method: "POST",
  });
}

export async function fetchMyOpcApplications(page = 1, pageSize = 10) {
  return getAuthorized<OpcApplicationListResponse>(`/public/opc-applications/mine?page=${page}&page_size=${pageSize}`);
}

export async function fetchMyOpcApplicationDetail(applicationId: number) {
  return getAuthorized<OpcApplicationDetailResponse>(`/public/opc-applications/mine/${applicationId}`);
}

export function buildIxiaMenLoginStartUrl(returnTo?: string) {
  const url = new URL(buildSiteApiUrl("/public/auth/ixiamen/start"));
  if (returnTo) {
    url.searchParams.set("return_to", returnTo);
  }
  return url.toString();
}

export function buildIxiaMenLogoutUrl() {
  return buildSiteApiUrl("/public/auth/ixiamen/logout");
}

export function getSiteAuthHeaders() {
  const token = getSiteAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function submitCommunityJoinApplicationWithCachedUser(targetCampus: string): Promise<{ id: number; target_campus: string; status: string; submitted_at: string }> {
  const user = getCachedSiteUser();
  const token = getSiteAuthToken();
  const response = await fetch(buildSiteApiUrl("/public/community-join/apply"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      target_campus: targetCampus,
      site_user_id: user?.id ?? null,
      site_user_name: user?.name ?? null,
      site_user_phone: user?.phone ?? null,
    }),
  });
  const result = await readApiResponse<{ id: number; target_campus: string; status: string; submitted_at: string }>(response);
  if (response.status === 401 && token) {
    clearSiteAuth();
    throw new Error("登录已过期，请重新登录。");
  }
  if (!response.ok || !result || result.code !== 0) {
    throw new Error(result?.detail || result?.message || "提交失败，请稍后重试。");
  }
  return result.data;
}

export async function submitCommunityJoinApplication(targetCampus: string): Promise<{ id: number; target_campus: string; status: string; submitted_at: string }> {
  try {
    return await submitCommunityJoinApplicationWithCachedUser(targetCampus);
  } catch (error) {
    throw normalizeRequestError(error);
  }
}

export function onSiteAuthChange(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(AUTH_EVENT, listener);
  return () => window.removeEventListener(AUTH_EVENT, listener);
}
