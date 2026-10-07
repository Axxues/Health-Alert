import { httpClient } from "@/services/core/client";
import type {
  LocationDiseaseEntry,
  LocationDetailData,
  LocationFilter,
  TimelineWeek,
} from "../types/forecast.types";

interface SeriesWeek {
  weekStart: string;
  actual: number | null;
  predicted: number;
  ciLower: number;
  ciUpper: number;
  isFuture: boolean;
}

interface SeriesMetrics {
  modelName: string;
  version: number;
  rmse: number;
  mae: number;
  r2: number;
  baselineName: string;
  baselineRmse: number;
  method: string;
  citation: string;
}

interface SeriesCovariates {
  rainMm: number;
  tempC: number;
  aqi: number;
  pageviews: number;
  date: string;
}

interface SeriesResponse {
  muni: string;
  disease: string;
  weeks: SeriesWeek[];
  modelVersion?: string;
  historyLength?: number;
  dataSources?: string[];
  metrics?: SeriesMetrics | null;
  covariates?: SeriesCovariates | null;
}

export async function listLocations(filter: LocationFilter = {}): Promise<LocationDiseaseEntry[]> {
  const params: Record<string, string> = {};
  const set = (k: string, v?: string) => {
    const t = v?.trim();
    if (t && t.toLowerCase() !== "all") params[k] = t;
  };
  set("search", filter.search);
  set("province", filter.province);
  set("municipality", filter.municipality);
  set("disease", filter.disease);
  set("riskLevel", filter.riskLevel);
  let res;
  try {
    res = await httpClient<LocationDiseaseEntry[]>("/forecast/locations", {
      method: "get",
      params,
    });
  } catch (err) {
    throw new Error(err instanceof Error && err.message ? err.message : "Failed to retrieve location intelligence directory.");
  }
  if (!res.data || res.data.length === 0) {
    throw new Error("No location intelligence available from the feed.");
  }
  return res.data;
}

export async function getLocationDetail(id: string, disease?: string): Promise<LocationDetailData> {
  let entries;
  try {
    const res = await httpClient<LocationDiseaseEntry[]>("/forecast/locations", {
      method: "get",
      params: {},
    });
    entries = res.data;
  } catch (err) {
    throw new Error(err instanceof Error && err.message ? err.message : "Failed to retrieve location detail.");
  }
  if (!entries || entries.length === 0) {
    throw new Error("No location intelligence available from the feed.");
  }

  // Forgiving fallback chain mirroring the old mock resolver: disease match first,
  // then exact id, then municipality-in-id fuzzy, then first of disease, then first overall.
  const KNOWN_DISEASES = ["dengue", "leptospirosis", "ili", "asthma"];
  const parts = id.split("|");
  const last = parts[parts.length - 1].toLowerCase().replace(/-/g, "");
  const diseaseHint =
    disease ?? (KNOWN_DISEASES.includes(last) && parts.length > 1 ? parts[parts.length - 1] : undefined);
  const pool = diseaseHint ? entries.filter((e) => e.disease === diseaseHint) : entries;
  const scope = pool.length > 0 ? pool : entries;
  const norm = (s: string) => s.toLowerCase().replace(/[-_]+/g, " ");
  const needle = norm(id);
  const isLastDisease = diseaseHint ? parts[parts.length - 1] === diseaseHint : false;
  const brgySlug = diseaseHint
    ? isLastDisease
      ? parts.slice(1, -1).join("|")
      : parts.slice(1).join("|")
    : parts.slice(1).join("|");
  const entry =
    scope.find((e) => norm(e.id) === needle) ??
    scope.find(
      (e) =>
        norm(e.municipality) === norm(parts[0]) &&
        (brgySlug ? norm(e.barangay ?? "") === norm(brgySlug) : true) &&
        (!diseaseHint || e.disease === diseaseHint)
    ) ??
    scope.find((e) => needle.includes(norm(e.municipality)) || norm(e.municipality).includes(needle)) ??
    scope[0];

  let series;
  try {
    const res = await httpClient<SeriesResponse>("/forecast/series", {
      method: "get",
      params: { muni: entry.municipality, disease: entry.disease, brgy: entry.barangay || undefined },
    });
    series = res.data;
  } catch (err) {
    throw new Error(err instanceof Error && err.message ? err.message : "Failed to retrieve location detail.");
  }
  const weeks = series?.weeks;
  if (!weeks || weeks.length === 0) {
    throw new Error("No forecast series available from the feed.");
  }

  // ponytail: week labels derived from backend weekStart dates; same "range · phase" convention as the old mock.
  const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeline: TimelineWeek[] = weeks.map((w, i) => {
    // ponytail: backend sends full ISO datetime ("2026-09-28T00:00:00"), date part only or double-suffix = Invalid Date
    const start = new Date(`${String(w.weekStart).slice(0, 10)}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const shortLabel = fmtDay(start);
    const phase = w.isFuture ? "Projected" : "Observed";
    return {
      weekNumber: i + 1,
      weekLabel: `${shortLabel}–${fmtDay(end)} · ${phase}`,
      shortLabel,
      isFuture: w.isFuture,
      actualCases: w.isFuture ? null : w.actual,
      predictedCases: w.isFuture ? w.predicted : w.actual ?? w.predicted,
      ciLower: w.ciLower,
      ciUpper: w.ciUpper,
    };
  });

  // ponytail: accuracy from the live series metrics block; null when no fitted model, never fabricated.
  const m = series?.metrics ?? null;
  const observed = timeline.filter((w) => w.actualCases !== null).map((w) => w.actualCases as number);
  const meanActual = observed.length > 0 ? observed.reduce((a, b) => a + b, 0) / observed.length : 0;
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const short = (s: string) => s.split(";")[0].trim();
  const accuracyMetrics = m
    ? {
        modelName: m.modelName,
        accuracyRate: Math.round(clamp01(m.r2) * 100),
        mape: meanActual > 0 ? Math.round((m.mae / meanActual) * 100) : null,
        r2Score: m.r2,
        aucRoc: null,
        confidenceMethod: `${short(m.method)} (${short(m.citation)})`,
      }
    : {
        modelName: "Heuristic baseline (no fitted model)",
        accuracyRate: null,
        mape: null,
        r2Score: null,
        aucRoc: null,
        confidenceMethod: "Heuristic projection band (no fitted model)",
      };

  // ponytail: only rain/temp/aqi have a live feed; the rest stay null (tiles hidden, never static).
  const cov = series?.covariates ?? null;
  const covariates = {
    cumulativeRainfallMm: cov?.rainMm ?? null,
    avgTemperatureC: cov?.tempC ?? null,
    standingWaterSites: null,
    larvalBreteauIndex: null,
    heatIndexC: null,
    aqiLevel: cov?.aqi ?? null,
  };

  const recommendedPlaybooks = [
    {
      id: 1,
      code: "SOP-VEC-01",
      title: "Targeted Larvicide & ULV Misting Deployment",
      urgency: entry.riskLevel === "high" ? ("immediate" as const) : ("priority" as const),
    },
    {
      id: 2,
      code: "SOP-CLN-04",
      title: "Sentinel Fever-Lane Staffing & IV Stockpile Requisition",
      urgency: "priority" as const,
    },
    {
      id: 3,
      code: "SOP-COM-09",
      title: "Barangay Health Worker Taglish House-to-House Alert",
      urgency: "routine" as const,
    },
  ];

  return {
    ...entry,
    // ponytail: live population from the locations feed; null when no row on file, never fabricated
    populationAtRisk: entry.populationAtRisk ?? null,
    populationYear: entry.populationYear ?? null,
    coordinates: { lat: entry.lat ?? 0, lng: entry.lng ?? 0 },
    timeline,
    accuracyMetrics,
    covariates,
    recommendedPlaybooks,
  };
}
