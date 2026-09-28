import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { SurveillanceFeed } from "../types/surveillance.types";

export async function listFeeds(search?: string): Promise<SurveillanceFeed[]> {
  const res = await httpClient<SurveillanceFeed[]>("/surveillance/feeds", {
    params: { ...getSessionParams(), ...buildPaginatedParams({ search }) },
  });
  return res.data ?? [];
}
