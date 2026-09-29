import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { Hotspot } from "../types/riskmaps.types";

const REGION_1_HOTSPOTS: Hotspot[] = [
  { muni: "Brgy. Sevilla, San Fernando City", disease: "dengue", level: "high", lat: 16.6159, lng: 120.3209 },
  { muni: "Brgy. Catbangen, San Fernando City", disease: "dengue", level: "high", lat: 16.6080, lng: 120.3170 },
  { muni: "Brgy. San Nicolas, Agoo", disease: "leptospirosis", level: "high", lat: 16.3217, lng: 120.3647 },
  { muni: "Brgy. Pantal, Dagupan City", disease: "leptospirosis", level: "high", lat: 16.0480, lng: 120.3400 },
  { muni: "Brgy. Lucao, Dagupan City", disease: "dengue", level: "medium", lat: 16.0350, lng: 120.3150 },
  { muni: "Brgy. Lingsat, San Fernando City", disease: "ili", level: "medium", lat: 16.6380, lng: 120.3270 },
  { muni: "Brgy. Central, Bauang", disease: "dengue", level: "medium", lat: 16.5244, lng: 120.3314 },
  { muni: "Brgy. Tamag, Vigan City", disease: "dengue", level: "medium", lat: 17.5680, lng: 120.3820 },
  { muni: "Brgy. Nalbo, Laoag City", disease: "asthma", level: "low", lat: 18.1960, lng: 120.5927 },
  { muni: "Brgy. Poblacion, Lingayen", disease: "leptospirosis", level: "medium", lat: 16.0222, lng: 120.2319 },
];

export async function listHotspots(): Promise<Hotspot[]> {
  try {
    const res = await httpClient<Hotspot[]>("/riskmaps/hotspots", {
      params: { ...getSessionParams(), ...buildPaginatedParams({}) },
    });
    if (res.data && res.data.length > 0) {
      return res.data;
    }
    return REGION_1_HOTSPOTS;
  } catch {
    return REGION_1_HOTSPOTS;
  }
}
