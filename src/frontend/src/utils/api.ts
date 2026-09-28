export interface PaginatedQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: unknown;
}

export function buildPaginatedParams(q: PaginatedQuery): Record<string, unknown> {
  const params: Record<string, unknown> = { page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
  for (const [k, v] of Object.entries(q)) {
    if (k === "page" || k === "pageSize") continue;
    if (v === undefined || v === null || v === "") continue;
    params[k] = v;
  }
  return params;
}
