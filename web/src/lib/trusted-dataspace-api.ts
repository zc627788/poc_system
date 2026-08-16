"use client";

import { clearSiteAuth, getSiteAuthToken, siteApiBaseUrl } from "@/lib/site-auth";
import type { ApiResponse, TrustedDataspaceRegistration, TrustedDataspaceRegistrationSubmitPayload } from "@/types";

export class TrustedDataspaceApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function apiUrl(path: string) {
  const base = siteApiBaseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//.test(base)) return `${base}${normalized}`;
  const origin = typeof window === "undefined" ? "http://127.0.0.1:3000" : window.location.origin;
  return `${origin}${base}${normalized}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSiteAuthToken();
  if (!token) throw new TrustedDataspaceApiError("请先登录后再继续操作", 401);
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
    });
  } catch {
    throw new TrustedDataspaceApiError("暂时无法连接 OPC 服务，请稍后重试", 0);
  }
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as Partial<ApiResponse<T>> & { detail?: string })
    : null;
  if (response.status === 401) clearSiteAuth();
  if (!response.ok || !body || body.code !== 0) {
    throw new TrustedDataspaceApiError(body?.detail || body?.message || "请求失败，请稍后重试", response.status);
  }
  return body.data as T;
}

export function fetchTrustedDataspaceRegistration() {
  return request<TrustedDataspaceRegistration | null>("/public/trusted-data-space/registration");
}

export function submitTrustedDataspaceRegistration(
  payload: TrustedDataspaceRegistrationSubmitPayload,
  idempotencyKey: string,
) {
  return request<TrustedDataspaceRegistration>("/public/trusted-data-space/registration/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export function syncTrustedDataspaceRegistration() {
  return request<TrustedDataspaceRegistration>("/public/trusted-data-space/registration/sync", { method: "POST" });
}
