import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { Hotspot } from "../types/riskmaps.types";

export async function listHotspots(): Promise<Hotspot[]> {
  let res;
  try {
    res = await httpClient<Hotspot[]>("/riskmaps/hotspots", {
      params: { ...getSessionParams(), ...buildPaginatedParams({}) },
    });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.message ? err.message : "Unable to load geospatial hotspot telemetry."
    );
  }
  if (!res.data || res.data.length === 0) {
    throw new Error("No hotspot telemetry available from the feed.");
  }
  return res.data;
}
