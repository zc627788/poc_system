import type { ApplicationFormDraftPayload } from "../state/page-state";
import type { ApiResponse } from "@/types";
import { getSiteAuthHeaders, siteApiBaseUrl } from "@/lib/site-auth";

type DraftResponse = {
  draft: ApplicationFormDraftPayload | null;
};

type DraftSaveResponse = {
  ok: boolean;
  updated_at: string;
};

const apiUrl = (path: string) => `${siteApiBaseUrl}${path}`;

async function parseApi<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T> & { detail?: string };
  if (!response.ok || result.code !== 0) {
    throw new Error(result.detail || result.message || "Request failed");
  }
  return result.data;
}

export async function getApplicationFormDraft(): Promise<DraftResponse> {
  const response = await fetch(apiUrl("/public/application-form/draft"), {
    headers: getSiteAuthHeaders(),
    cache: "no-store",
  });
  return parseApi<DraftResponse>(response);
}

export async function saveApplicationFormDraft(payload: ApplicationFormDraftPayload): Promise<DraftSaveResponse> {
  const response = await fetch(apiUrl("/public/application-form/draft"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getSiteAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return parseApi<DraftSaveResponse>(response);
}

export async function clearApplicationFormDraft(): Promise<{ ok: boolean }> {
  const response = await fetch(apiUrl("/public/application-form/draft/clear"), {
    method: "POST",
    headers: getSiteAuthHeaders(),
  });
  return parseApi<{ ok: boolean }>(response);
}
