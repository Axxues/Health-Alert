import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { HealthAlert } from "../types/alerts.types";

export async function listAlerts(): Promise<HealthAlert[]> {
  const res = await httpClient<HealthAlert[]>("/alerts", {
    params: { ...getSessionParams(), ...buildPaginatedParams({}) },
  });
  return res.data ?? [];
}

export async function ackAlert(id: number): Promise<HealthAlert | null> {
  const res = await httpClient<HealthAlert>(`/alerts/${id}/ack`, {
    method: "post",
    params: { ...getSessionParams() },
  });
  return res.data;
}
