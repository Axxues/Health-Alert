import { httpClient } from "@/services/core/client";
import type { Alert, BroadcastReq } from "../types/alerts.types";

export async function listAlerts(): Promise<Alert[]> {
  const res = await httpClient<Alert[]>("/alerts", { method: "get" });
  return res.data ?? [];
}
export async function ackAlert(id: number): Promise<void> {
  await httpClient(`/alerts/${id}/ack`, { method: "post" });
}
export async function broadcastAlert(req: BroadcastReq): Promise<void> {
  await httpClient("/alerts/broadcast", { method: "post", data: req });
}
