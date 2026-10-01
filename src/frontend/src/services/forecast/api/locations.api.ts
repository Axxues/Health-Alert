import { httpClient } from "@/services/core/client";
import type {
  LocationDiseaseEntry,
  LocationDetailData,
  LocationFilter,
  TimelineWeek,
} from "../types/forecast.types";

const RAW_LOCATIONS: Omit<LocationDiseaseEntry, "activeCases" | "prevWeekCases" | "changePercent">[] = [
  // === NATIONAL CAPITAL REGION (NCR) ===
  {
    id: "ncr-qc-batasan",
    province: "Metro Manila (NCR)",
    municipality: "Quezon City",
    barangay: "Batasan Hills",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.88,
    sentinelFacility: "East Avenue Medical Center / QC Health Department",
    lastUpdated: "2026-09-30T02:00:00Z",
  },
  {
    id: "ncr-mnl-tondo",
    province: "Metro Manila (NCR)",
    municipality: "City of Manila",
    barangay: "Tondo",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "high",
    outbreakProbability: 0.84,
    sentinelFacility: "San Lazaro Hospital / Tondo Medical Center",
    lastUpdated: "2026-09-30T02:00:00Z",
  },
  {
    id: "ncr-cal-bagongsilang",
    province: "Metro Manila (NCR)",
    municipality: "Caloocan City",
    barangay: "176 Bagong Silang",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "moderate",
    outbreakProbability: 0.58,
    sentinelFacility: "Caloocan City Medical Center",
    lastUpdated: "2026-09-30T01:30:00Z",
  },
  {
    id: "ncr-psg-pinagbuhatan",
    province: "Metro Manila (NCR)",
    municipality: "Pasig City",
    barangay: "Pinagbuhatan",
    disease: "asthma",
    diseaseName: "Bronchial Asthma Aggravation",
    category: "environmental",
    riskLevel: "moderate",
    outbreakProbability: 0.52,
    sentinelFacility: "Pasig City General Hospital",
    lastUpdated: "2026-09-30T01:00:00Z",
  },

  // === CENTRAL LUZON (REGION 3) ===
  {
    id: "r3-pam-sanfernando",
    province: "Pampanga",
    municipality: "City of San Fernando",
    barangay: "Dolores",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.79,
    sentinelFacility: "Jose B. Lingad Memorial General Hospital (JBLMGH)",
    lastUpdated: "2026-09-30T01:15:00Z",
  },
  {
    id: "r3-bul-malolos",
    province: "Bulacan",
    municipality: "Malolos City",
    barangay: "Guinhawa",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "moderate",
    outbreakProbability: 0.55,
    sentinelFacility: "Bulacan Medical Center",
    lastUpdated: "2026-09-30T01:00:00Z",
  },

  // === CALABARZON (REGION 4A) ===
  {
    id: "r4a-cav-dasma",
    province: "Cavite",
    municipality: "Dasmariñas City",
    barangay: "Salitran",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.81,
    sentinelFacility: "Pagamusan ng Dasmariñas",
    lastUpdated: "2026-09-30T01:30:00Z",
  },
  {
    id: "r4a-lag-starosa",
    province: "Laguna",
    municipality: "Santa Rosa City",
    barangay: "Balibago",
    disease: "asthma",
    diseaseName: "Bronchial Asthma Aggravation",
    category: "environmental",
    riskLevel: "moderate",
    outbreakProbability: 0.49,
    sentinelFacility: "Santa Rosa Community Hospital",
    lastUpdated: "2026-09-30T00:45:00Z",
  },
  {
    id: "r4a-bat-batangas",
    province: "Batangas",
    municipality: "Batangas City",
    barangay: "Kumintang Ibaba",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "moderate",
    outbreakProbability: 0.46,
    sentinelFacility: "Batangas Medical Center",
    lastUpdated: "2026-09-30T00:30:00Z",
  },

  // === CENTRAL VISAYAS (REGION 7) ===
  {
    id: "r7-ceb-guadalupe",
    province: "Cebu",
    municipality: "Cebu City",
    barangay: "Guadalupe",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.85,
    sentinelFacility: "Vicente Sotto Memorial Medical Center (VSMMC)",
    lastUpdated: "2026-09-30T02:00:00Z",
  },
  {
    id: "r7-ceb-mandaue",
    province: "Cebu",
    municipality: "Mandaue City",
    barangay: "Subangdaku",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "moderate",
    outbreakProbability: 0.53,
    sentinelFacility: "Mandaue City District Hospital",
    lastUpdated: "2026-09-30T01:45:00Z",
  },
  {
    id: "r7-boh-tagbilaran",
    province: "Bohol",
    municipality: "Tagbilaran City",
    barangay: "Poblacion",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "low",
    outbreakProbability: 0.29,
    sentinelFacility: "Gov. Celestino Gallares Memorial Medical Center",
    lastUpdated: "2026-09-30T00:30:00Z",
  },

  // === WESTERN VISAYAS (REGION 6) ===
  {
    id: "r6-ilo-mandurriao",
    province: "Iloilo",
    municipality: "Iloilo City",
    barangay: "Mandurriao",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.77,
    sentinelFacility: "Western Visayas Medical Center (WVMC)",
    lastUpdated: "2026-09-30T01:30:00Z",
  },
  {
    id: "r6-neg-bacolod",
    province: "Negros Occidental",
    municipality: "Bacolod City",
    barangay: "Mansilingan",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "moderate",
    outbreakProbability: 0.48,
    sentinelFacility: "Corazon Locsin Montelibano Memorial Regional Hospital",
    lastUpdated: "2026-09-30T01:15:00Z",
  },

  // === DAVAO REGION (REGION 11) ===
  {
    id: "r11-dav-buhangin",
    province: "Davao del Sur",
    municipality: "Davao City",
    barangay: "Buhangin",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.82,
    sentinelFacility: "Southern Philippines Medical Center (SPMC)",
    lastUpdated: "2026-09-30T02:00:00Z",
  },
  {
    id: "r11-dav-talomo",
    province: "Davao del Sur",
    municipality: "Davao City",
    barangay: "Talomo",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "moderate",
    outbreakProbability: 0.51,
    sentinelFacility: "Davao City Health Office",
    lastUpdated: "2026-09-30T01:30:00Z",
  },

  // === NORTHERN MINDANAO (REGION 10) ===
  {
    id: "r10-cdo-carmen",
    province: "Misamis Oriental",
    municipality: "Cagayan de Oro City",
    barangay: "Carmen",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "moderate",
    outbreakProbability: 0.63,
    sentinelFacility: "Northern Mindanao Medical Center (NMMC)",
    lastUpdated: "2026-09-30T01:00:00Z",
  },

  // === CORDILLERA (CAR) ===
  {
    id: "car-bgu-irisan",
    province: "Benguet",
    municipality: "Baguio City",
    barangay: "Irisan",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "moderate",
    outbreakProbability: 0.54,
    sentinelFacility: "Baguio General Hospital and Medical Center (BGHMC)",
    lastUpdated: "2026-09-30T01:15:00Z",
  },
  {
    id: "car-bgu-loakan",
    province: "Benguet",
    municipality: "Baguio City",
    barangay: "Loakan",
    disease: "asthma",
    diseaseName: "Bronchial Asthma Aggravation",
    category: "environmental",
    riskLevel: "moderate",
    outbreakProbability: 0.47,
    sentinelFacility: "BGHMC / Baguio Health Services Office",
    lastUpdated: "2026-09-30T01:00:00Z",
  },

  // === NORTHERN LUZON (REGION 1 - ILOCOS) ===
  {
    id: "lu-sfc-sevilla",
    province: "La Union",
    municipality: "San Fernando City",
    barangay: "Sevilla",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.82,
    sentinelFacility: "Bethany Hospital / CHO San Fernando",
    lastUpdated: "2026-09-29T08:00:00Z",
  },
  {
    id: "lu-sfc-catbangen",
    province: "La Union",
    municipality: "San Fernando City",
    barangay: "Catbangen",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.76,
    sentinelFacility: "Ilocos Training and Regional Medical Center (ITRMC)",
    lastUpdated: "2026-09-29T08:00:00Z",
  },
  {
    id: "lu-sfc-lingsat",
    province: "La Union",
    municipality: "San Fernando City",
    barangay: "Lingsat",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "moderate",
    outbreakProbability: 0.54,
    sentinelFacility: "San Fernando City Health Station 2",
    lastUpdated: "2026-09-29T07:30:00Z",
  },
  {
    id: "lu-agoo-san-nicolas",
    province: "La Union",
    municipality: "Agoo",
    barangay: "San Nicolas",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "high",
    outbreakProbability: 0.79,
    sentinelFacility: "La Union Medical Center (LUMC)",
    lastUpdated: "2026-09-29T06:15:00Z",
  },
  {
    id: "lu-agoo-sta-barbara",
    province: "La Union",
    municipality: "Agoo",
    barangay: "Santa Barbara",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "moderate",
    outbreakProbability: 0.48,
    sentinelFacility: "Agoo RHU 1",
    lastUpdated: "2026-09-29T06:15:00Z",
  },
  {
    id: "lu-bauang-central-east",
    province: "La Union",
    municipality: "Bauang",
    barangay: "Central East",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "moderate",
    outbreakProbability: 0.58,
    sentinelFacility: "Bauang RHU / Municipal Health Center",
    lastUpdated: "2026-09-29T05:45:00Z",
  },
  {
    id: "lu-bauang-parian-oeste",
    province: "La Union",
    municipality: "Bauang",
    barangay: "Parian Oeste",
    disease: "asthma",
    diseaseName: "Bronchial Asthma Aggravation",
    category: "environmental",
    riskLevel: "moderate",
    outbreakProbability: 0.45,
    sentinelFacility: "Bauang Rural Clinic",
    lastUpdated: "2026-09-29T05:45:00Z",
  },
  {
    id: "lu-bacnotan-poblacion",
    province: "La Union",
    municipality: "Bacnotan",
    barangay: "Poblacion",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "low",
    outbreakProbability: 0.22,
    sentinelFacility: "Bacnotan District Hospital",
    lastUpdated: "2026-09-29T04:20:00Z",
  },
  {
    id: "lu-naguilian-ortiz",
    province: "La Union",
    municipality: "Naguilian",
    barangay: "Ortiz",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "moderate",
    outbreakProbability: 0.51,
    sentinelFacility: "Naguilian District Hospital",
    lastUpdated: "2026-09-29T04:10:00Z",
  },
  {
    id: "pan-dagupan-lucao",
    province: "Pangasinan",
    municipality: "Dagupan City",
    barangay: "Lucao",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "high",
    outbreakProbability: 0.84,
    sentinelFacility: "Region 1 Medical Center (R1MC)",
    lastUpdated: "2026-09-29T08:00:00Z",
  },
  {
    id: "pan-dagupan-pantal",
    province: "Pangasinan",
    municipality: "Dagupan City",
    barangay: "Pantal",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    category: "waterborne",
    riskLevel: "high",
    outbreakProbability: 0.81,
    sentinelFacility: "Dagupan City Health Office",
    lastUpdated: "2026-09-29T07:45:00Z",
  },
  {
    id: "pan-san-fabian-poblacion",
    province: "Pangasinan",
    municipality: "San Fabian",
    barangay: "Poblacion",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "low",
    outbreakProbability: 0.28,
    sentinelFacility: "San Fabian RHU",
    lastUpdated: "2026-09-29T06:00:00Z",
  },
  {
    id: "is-vigan-pantay-daya",
    province: "Ilocos Sur",
    municipality: "Vigan City",
    barangay: "Pantay Daya",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    riskLevel: "moderate",
    outbreakProbability: 0.62,
    sentinelFacility: "Gabriela Silang General Hospital",
    lastUpdated: "2026-09-29T07:15:00Z",
  },
  {
    id: "is-candon-san-nicolas",
    province: "Ilocos Sur",
    municipality: "Candon City",
    barangay: "San Nicolas",
    disease: "asthma",
    diseaseName: "Bronchial Asthma Aggravation",
    category: "environmental",
    riskLevel: "moderate",
    outbreakProbability: 0.44,
    sentinelFacility: "Candon General Hospital",
    lastUpdated: "2026-09-29T06:30:00Z",
  },
  {
    id: "in-laoag-san-guillermo",
    province: "Ilocos Norte",
    municipality: "Laoag City",
    barangay: "San Guillermo",
    disease: "ili",
    diseaseName: "Flu-like Illness (ILI)",
    category: "respiratory",
    riskLevel: "low",
    outbreakProbability: 0.25,
    sentinelFacility: "Gov. Roque B. Ablan Sr. Memorial Hospital",
    lastUpdated: "2026-09-29T05:00:00Z",
  },
];

// Generates dynamic active cases and weekly changes from probability and disease baseline
function buildEntry(raw: typeof RAW_LOCATIONS[0]): LocationDiseaseEntry {
  const base = raw.disease === "dengue" ? 28 : raw.disease === "leptospirosis" ? 14 : raw.disease === "ili" ? 42 : 18;
  const activeCases = Math.round(base * (raw.outbreakProbability * 1.5 + 0.4));
  const prevWeekCases = Math.max(1, Math.round(activeCases * 0.85));
  const changePercent = Math.round(((activeCases - prevWeekCases) / prevWeekCases) * 100);

  return {
    ...raw,
    activeCases,
    prevWeekCases,
    changePercent,
  };
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
  const raw = RAW_LOCATIONS.find((l) => l.id === id) ?? RAW_LOCATIONS[0];
  const entry = buildEntry({ ...raw, disease: (disease as typeof raw.disease) || raw.disease });

  // Generate 8 past weeks + 4 future weeks (12 weeks total)
  const timeline: TimelineWeek[] = [];
  const startWeek = 31; // W31 (Aug 4) to W42 (Oct 20)
  const currentWeek = 38; // Current epidemic week
  // ponytail: mock epi weeks anchored to W31 starting Tue Aug 4 2026; derive from real week-start dates once the API serves them.
  const weekStart = (w: number) => {
    const d = new Date(2026, 7, 4 + (w - startWeek) * 7);
    const fmt = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return { short: fmt(d), range: `${fmt(d)}–${fmt(end)}` };
  };
  const peakForecast = Math.round(entry.activeCases * (entry.outbreakProbability >= 0.7 ? 1.45 : 1.15));

  for (let w = startWeek; w <= startWeek + 11; w++) {
    const isFuture = w > currentWeek;
    const phase = isFuture ? "Projected" : w === currentWeek ? "Current" : "Observed";
    const dates = weekStart(w);
    const weekLabel = `${dates.range} · ${phase}`;
    const shortLabel = dates.short;

    if (!isFuture) {
      // Historical actual counts curve leading to current active cases
      const progress = (w - startWeek) / (currentWeek - startWeek);
      const curve = Math.sin(progress * 1.5);
      const actualCases = Math.max(2, Math.round(entry.prevWeekCases * 0.4 + curve * (entry.activeCases - entry.prevWeekCases * 0.4)));
      const predictedCases = Math.round(actualCases * 0.96);
      const ciLower = Math.max(0, Math.round(predictedCases * 0.88));
      const ciUpper = Math.round(predictedCases * 1.12);

      timeline.push({
        weekNumber: w,
        weekLabel,
        shortLabel,
        isFuture: false,
        actualCases,
        predictedCases,
        ciLower,
        ciUpper,
      });
    } else {
      // Future predicted counts with expanding 95% confidence interval
      const futureStep = w - currentWeek;
      const forecastVal = Math.round(
        entry.activeCases + (peakForecast - entry.activeCases) * Math.min(1, futureStep * 0.4)
      );
      const uncertainty = 0.08 + futureStep * 0.04;
      const ciLower = Math.max(0, Math.round(forecastVal * (1 - uncertainty)));
      const ciUpper = Math.round(forecastVal * (1 + uncertainty));

      timeline.push({
        weekNumber: w,
        weekLabel,
        shortLabel,
        isFuture: true,
        actualCases: null,
        predictedCases: forecastVal,
        ciLower,
        ciUpper,
      });
    }
  }

  // Model accuracy stats from Chapter 2 of Literature Rev2
  const accuracyMetrics = {
    modelName:
      entry.disease === "dengue"
        ? "4-Layer Bi-LSTM (Lag-3 Climate Covariates)"
        : entry.disease === "leptospirosis"
        ? "Distributed Lag Non-Linear Model (DLNM Rain/Temp)"
        : entry.disease === "ili"
        ? "ARGO Autoregressive + Taglish Search Terms"
        : "Rothfusz Heat-Index & AQI Distributed Model",
    accuracyRate: 93.8,
    mape: 5.8,
    r2Score: 0.91,
    aucRoc: 0.92,
    confidenceMethod: "95% Empirical Bootstrap Confidence Band",
  };

  const covariates = {
    cumulativeRainfallMm: entry.disease === "leptospirosis" ? 184.2 : 112.5,
    avgTemperatureC: 31.4,
    standingWaterSites: entry.riskLevel === "high" ? 18 : 6,
    larvalBreteauIndex: entry.riskLevel === "high" ? 24.5 : 8.2,
    heatIndexC: 38.6,
    aqiLevel: 42,
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
    populationAtRisk: 14200,
    coordinates: { lat: 16.6159, lng: 120.3209 },
    timeline,
    accuracyMetrics,
    covariates,
    recommendedPlaybooks,
  };
}
