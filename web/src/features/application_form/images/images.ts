import type { OpcMaterialUploadItem } from "@/types";
import { getSiteAuthHeaders, siteApiBaseUrl } from "@/lib/site-auth";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  detail?: string;
};

async function parseApi<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || result.code !== 0) {
    throw new Error(result.detail || result.message || "材料操作失败，请稍后重试。");
  }
  return result.data;
}

export async function uploadApplicationFormImage(imageKey: string, file: File): Promise<OpcMaterialUploadItem> {
  const formData = new FormData();
  formData.append("image_key", imageKey);
  formData.append("file", file);
  const response = await fetch(`${siteApiBaseUrl}/public/application-form/images`, {
    method: "POST",
    headers: getSiteAuthHeaders(),
    body: formData,
  });
  return parseApi<OpcMaterialUploadItem>(response);
}

export async function deleteApplicationFormImage(fileId: number): Promise<boolean> {
  const response = await fetch(`${siteApiBaseUrl}/public/application-form/images`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getSiteAuthHeaders(),
    },
    body: JSON.stringify({ file_id: fileId }),
  });
  return parseApi<boolean>(response);
}
