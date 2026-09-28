import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { Hotspot } from "../types/riskmaps.types";

export async function listHotspots(): Promise<Hotspot[]> {
  const res = await httpClient<Hotspot[]>("/riskmaps/hotspots", {
    params: { ...getSessionParams(), ...buildPaginatedParams({}) },
  });
  return res.data ?? [];
}
