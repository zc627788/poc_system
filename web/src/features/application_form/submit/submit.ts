import type { ApplicationFormSubmitPayload } from "../state/page-state";
import type { ApiResponse } from "@/types";
import { getSiteAuthHeaders, siteApiBaseUrl } from "@/lib/site-auth";

export type SubmitResponse = {
  id: number;
  application_no: string;
  status: string;
  submitted_at: string;
};

export async function submitApplicationForm(payload: ApplicationFormSubmitPayload): Promise<SubmitResponse> {
  const response = await fetch(`${siteApiBaseUrl}/public/application-form/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getSiteAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as ApiResponse<SubmitResponse> & { detail?: string };
  if (!response.ok || result.code !== 0) {
    throw new Error(result.detail || result.message || "提交失败，请稍后重试。");
  }
  return result.data;
}
