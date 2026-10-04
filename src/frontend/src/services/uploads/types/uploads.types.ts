export interface UploadResult { batchId: number; accepted: number; quarantined: number; duplicates: number; }
export interface UploadBatch { id: number; fileName: string | null; uploadedBy: string | null; uploadedAt: string | null; status: string | null; accepted: number; quarantined: number; duplicates: number; }
export interface UploadIssue { id: number; batchId: number; row: number; reason: string | null; rawLine: string | null; sourceKey: string | null; disease: string | null; count: number | null; reportedAt: string | null; resolved: boolean; resolution: string | null; }
export type ResolveAction = "accept" | "discard";

// ponytail: exact plan column order; server GET template is the download source, this is the offline fallback
export const TEMPLATE_COLUMNS = [
  "morbidity_week", "morbidity_year", "province", "municipality", "barangay",
  "facility_name", "facility_type", "disease_code", "cases_this_week", "deaths_this_week",
  "age_under5", "age_5plus", "male", "female", "prepared_by", "contact", "date_submitted",
] as const;

export function buildTemplateCsv(): string {
  return TEMPLATE_COLUMNS.join(",") + "\n# 39,2026,La Union,Agoo,Poblacion,Agoo RHU,RHU,dengue,5,0,1,4,3,2,J. Dela Cruz,09171234567,2026-10-01";
}
