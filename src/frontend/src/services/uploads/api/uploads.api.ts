import { api, httpClient } from "@/services/core/client";
import type { ResolveAction, UploadBatch, UploadIssue, UploadResult } from "../types/uploads.types";
import { buildTemplateCsv } from "../types/uploads.types";

export async function uploadBatch(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await httpClient<UploadResult>("/surveillance/upload", { method: "post", data: form });
  return res.data ?? { batchId: 0, accepted: 0, quarantined: 0, duplicates: 0 };
}

export async function listBatches(): Promise<UploadBatch[]> {
  const res = await httpClient<UploadBatch[]>("/surveillance/batches", { method: "get" });
  return res.data ?? [];
}

export async function listIssues(batchId: number): Promise<UploadIssue[]> {
  const res = await httpClient<UploadIssue[]>(`/surveillance/batches/${batchId}/issues`, { method: "get" });
  return res.data ?? [];
}

export async function resolveIssue(id: number, action: ResolveAction): Promise<void> {
  await httpClient(`/surveillance/issues/${id}/resolve`, { method: "post", data: { action } });
}

export async function fetchTemplateText(): Promise<string> {
  try {
    const res = await api.request<string>({ url: "/surveillance/template", method: "get", responseType: "text" });
    if (typeof res.data === "string" && res.data.trim()) return res.data;
  } catch {
    // ponytail: server template unreachable — client-side fallback below
  }
  return buildTemplateCsv();
}

export async function downloadTemplate(): Promise<void> {
  const text = await fetchTemplateText();
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "pidsr-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
