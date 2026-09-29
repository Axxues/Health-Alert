import type {
  LocationDiseaseEntry,
  LocationDetailData,
  LocationFilter,
  TimelineWeek,
} from "../types/forecast.types";

const RAW_LOCATIONS: Omit<LocationDiseaseEntry, "activeCases" | "prevWeekCases" | "changePercent">[] = [
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
  const entries = RAW_LOCATIONS.map(buildEntry);

  return entries.filter((loc) => {
    if (filter.province && loc.province.toLowerCase() !== filter.province.toLowerCase()) {
      return false;
    }
    if (filter.municipality) {
      const targetMuni = filter.municipality.toLowerCase();
      const locMuni = loc.municipality.toLowerCase();
      const matches =
        locMuni === targetMuni ||
        locMuni.includes(targetMuni) ||
        targetMuni.includes(locMuni) ||
        (locMuni.includes("san fernando") && targetMuni.includes("san fernando"));
      if (!matches) {
        return false;
      }
    }
    if (filter.disease && loc.disease.toLowerCase() !== filter.disease.toLowerCase()) {
      return false;
    }
    if (filter.riskLevel && loc.riskLevel.toLowerCase() !== filter.riskLevel.toLowerCase()) {
      return false;
    }
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      const match =
        loc.barangay.toLowerCase().includes(q) ||
        loc.municipality.toLowerCase().includes(q) ||
        loc.province.toLowerCase().includes(q) ||
        loc.disease.toLowerCase().includes(q) ||
        loc.diseaseName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export async function getLocationDetail(id: string, disease?: string): Promise<LocationDetailData> {
  const raw = RAW_LOCATIONS.find((l) => l.id === id) ?? RAW_LOCATIONS[0];
  const entry = buildEntry({ ...raw, disease: (disease as typeof raw.disease) || raw.disease });

  // Generate 8 past weeks + 4 future weeks (12 weeks total)
  const timeline: TimelineWeek[] = [];
  const startWeek = 31; // W31 (Aug 4) to W42 (Oct 20)
  const currentWeek = 38; // Current epidemic week
  const peakForecast = Math.round(entry.activeCases * (entry.outbreakProbability >= 0.7 ? 1.45 : 1.15));

  for (let w = startWeek; w <= startWeek + 11; w++) {
    const isFuture = w > currentWeek;
    const weekLabel = `W${w} (${isFuture ? "Predicted" : w === currentWeek ? "Current" : "Historical"})`;

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
