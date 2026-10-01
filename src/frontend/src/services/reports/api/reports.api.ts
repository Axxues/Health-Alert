import { httpClient } from "@/services/core/client";
import type { WeeklyBulletin, CaseExportRow } from "../types/reports.types";

export async function bulletin(week: string): Promise<WeeklyBulletin> {
  const res = await httpClient<WeeklyBulletin>("/reports/bulletin", { method: "get", params: { week } });
  return res.data ?? { week, diseases: [], hotspots: [], activeAlerts: [] };
}
export async function exportRows(muni?: string, disease?: string, from?: string, to?: string): Promise<CaseExportRow[]> {
  const res = await httpClient<CaseExportRow[]>("/reports/export", { method: "get", params: { muni, disease, from, to } });
  return res.data ?? [];
}
