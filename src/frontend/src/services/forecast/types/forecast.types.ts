export interface ForecastOutlook {
  probability: number;
  band: string;
  drivers: string[];
  muni?: string | null;
}

export interface ForecastRunReq {
  disease?: string;
  muni?: string;
}

export interface LocationDiseaseEntry {
  id: string;
  province: string;
  municipality: string;
  barangay: string;
  disease: "dengue" | "leptospirosis" | "ili" | "asthma";
  diseaseName: string;
  category: "vector" | "waterborne" | "respiratory" | "environmental";
  activeCases: number;
  prevWeekCases: number;
  changePercent: number;
  riskLevel: "high" | "moderate" | "low";
  outbreakProbability: number;
  sentinelFacility: string;
  lastUpdated: string;
  lat?: number;
  lng?: number;
}

export interface TimelineWeek {
  weekNumber: number;
  weekLabel: string;
  shortLabel: string;
  isFuture: boolean;
  actualCases: number | null;
  predictedCases: number;
  ciLower: number;
  ciUpper: number;
}

export interface LocationDetailData extends LocationDiseaseEntry {
  populationAtRisk: number;
  coordinates: { lat: number; lng: number };
  timeline: TimelineWeek[];
  accuracyMetrics: {
    modelName: string;
    accuracyRate: number | null;
    mape: number | null;
    r2Score: number | null;
    aucRoc?: number | null;
    confidenceMethod: string;
  };
  covariates: {
    cumulativeRainfallMm: number | null;
    avgTemperatureC: number | null;
    standingWaterSites: number | null;
    larvalBreteauIndex: number | null;
    heatIndexC: number | null;
    aqiLevel: number | null;
  };
  recommendedPlaybooks: {
    id: number;
    code: string;
    title: string;
    urgency: "immediate" | "priority" | "routine";
  }[];
}

export interface LocationFilter {
  search?: string;
  province?: string;
  municipality?: string;
  disease?: string;
  riskLevel?: string;
}
