import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { ForecastOutlook, ForecastRunReq } from "../types/forecast.types";

// ponytail: thin wrappers over envelope; real caching lives in httpClient
export async function getOutlook(req: ForecastRunReq): Promise<ForecastOutlook> {
  const res = await httpClient<ForecastOutlook>("/forecast/outlook", {
    params: { ...getSessionParams(), ...buildPaginatedParams({ ...req }) },
  });
  return res.data ?? { probability: 0, band: "Caution", drivers: [] };
}

export async function runForecast(req: ForecastRunReq): Promise<ForecastOutlook> {
  const res = await httpClient<ForecastOutlook>("/forecast/run", {
    method: "post",
    data: req,
    params: { ...getSessionParams() },
  });
  return res.data ?? { probability: 0, band: "Caution", drivers: [] };
}
