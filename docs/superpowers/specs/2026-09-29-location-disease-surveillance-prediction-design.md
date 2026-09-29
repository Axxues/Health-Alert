# Location-Based Disease Surveillance & Predictive Intelligence Specification

**Date:** 2026-09-29  
**Branch:** `feature/modern-surveillance-ui`  
**Reference Document:** `HealthAlert_FullSystem_Data_Literature_Rev2.docx`  
**Target Domains:** `Surveillance` (`/surveillance`), `Forecasting` (`/forecast`), `API Backend` (.NET 10), and `n8n Automation` (Port 5678)

---

## 1. Executive Summary & Objective

This specification upgrades Health Alert's **Surveillance** and **Forecasting** modules from static aggregate overview cards into a dynamic, location-centric disease directory and master-detail intelligence flow. Users can explore monitored geographic areas (provinces, municipalities, and barangays), filter by administrative levels and diseases, and drill down into dedicated location intelligence views.

Each location detail page features an interactive **Dual-Horizon Prediction Graph** displaying:
1. **Past 8 Weeks of Historical Actuals:** Confirmed weekly clinical case counts ingested from statutory PIDSR/ESU feeds.
2. **Current Epidemic Week Demarcation Line:** Clear visual boundary separating observed data from AI projections.
3. **Future 4 Weeks of Forecasted Case Projections:** Neural Bi-LSTM, ARGO, and DLNM models computing predicted case counts with 95% confidence intervals.
4. **Model Performance & Accuracy Metrics:** High-visibility accuracy scorecard displaying model accuracy (e.g., 93.8%), Mean Absolute Percentage Error (MAPE), and coefficient of determination ($R^2$).

---

## 2. Automation & Data Architecture

Following `HealthAlert_FullSystem_Data_Literature_Rev2.docx` (Chapters 2–4), all data flows through automated ingestion pipelines without manual encoding:

```
[External Sources]
(PAGASA / OpenWeather / DENR / DOH PIDSR / ESU / GDELT / Trends)
                       │
                       ▼
             [n8n Workflow Engine] (Port 5678)
       (26 active automated workflows in Docker)
                       │
     HTTP POST with X-Cron-Key: dev-cron-key
                       │
                       ▼
        [ASP.NET Core 10 Web API] (Port 5109)
         ├── SurveillanceController / Ingest
         ├── ForecastController / Outlook & Location Detail
         └── RiskMapsController / Hotspots
                       │
                       ▼
           [SQL Server / Entity Framework]
        (tblCases, tblForecastRuns, tblDiseases, tblFeeds)
                       │
                       ▼
            [React 19 Vite Frontend] (Port 5173)
        ├── /forecast & /forecast/:locationId
        └── /surveillance & /surveillance/:locationId
```

### Automation Health & Active Status:
- **Engine:** n8n running in Docker on port `5678`.
- **Workflows:** 26 automated workflows activated and verified:
  - `ingest-weather` (hourly weather covariates)
  - `ingest-pidsr` (weekly Friday PIDSR bulletin scrape)
  - `ingest-esu` (daily regional ESU outbreak ingestion)
  - `ingest-itis` (quarterly ITIS reports)
  - `ingest-covid` (weekly Monday COVID syndromic cases)
  - `ingest-aqi` (hourly AQI and PM2.5 readings)
  - `ingest-heatmap` (hourly heat-index grid)
  - `ingest-trends` (daily Google Trends Taglish search terms)
  - `ingest-social` (daily Twitter/X syndromic signal tracking)
  - `ingest-news` (15-min GDELT and health RSS monitoring)
  - `forecast-orchestrator` (triggers forecast execution upon fresh ground truth)
  - `alert-fanout` (dispatches outbreak alerts across channels)
  - `rag-reindex` (rebuilds guideline embeddings)
- **Vector DB:** Qdrant container running on port `6333` for RAG retrieval.
- **Backend API:** ASP.NET Core running on `http://localhost:5109` (accessible from n8n Docker via `http://host.docker.internal:5109`).

---

## 3. Data Contracts & API Schema

### 3.1 Location Disease Entry (Directory Payload)
Endpoint: `GET /api/forecast/locations` or `GET /api/surveillance/locations`

```typescript
export interface LocationDiseaseEntry {
  id: string; // e.g. "lu-sfc-sevilla"
  province: string; // e.g. "La Union"
  municipality: string; // e.g. "City of San Fernando"
  barangay: string; // e.g. "Sevilla"
  disease: "dengue" | "leptospirosis" | "ili" | "asthma";
  diseaseName: string; // e.g. "Dengue Fever"
  category: "vector" | "waterborne" | "respiratory" | "environmental";
  activeCases: number; // Current week's reported count
  prevWeekCases: number;
  changePercent: number; // e.g. +14.3
  riskLevel: "high" | "moderate" | "low";
  outbreakProbability: number; // 0.0 - 1.0 (e.g. 0.78 for 78%)
  sentinelFacility: string; // e.g. "Bethany Hospital / CHO San Fernando"
  lastUpdated: string;
}
```

### 3.2 Location Detail Payload
Endpoint: `GET /api/forecast/location/{id}` or `GET /api/surveillance/location/{id}`

```typescript
export interface LocationDetailData extends LocationDiseaseEntry {
  populationAtRisk: number; // e.g. 14,200
  coordinates: { lat: number; lng: number };
  
  // Dual-Horizon Time-Series: 8 Past Weeks (Actuals) + 4 Future Weeks (Predictions)
  timeline: {
    weekNumber: number; // e.g. 31 to 42
    weekLabel: string; // e.g. "W31 (Aug 4)", "W38 (Sep 22 - Current)"
    isFuture: boolean;
    actualCases: number | null; // null for future weeks
    predictedCases: number; // model prediction
    ciLower: number; // 95% confidence lower bound
    ciUpper: number; // 95% confidence upper bound
  }[];

  // Predictive Model Accuracy Scorecard
  accuracyMetrics: {
    modelName: string; // "Bi-LSTM + Weather Covariates (Literature Rev2)"
    accuracyRate: number; // 93.8%
    mape: number; // 5.8% (Mean Absolute Percentage Error)
    r2Score: number; // 0.91
    aucRoc: number; // 0.92
    confidenceMethod: string; // "95% Empirical Bootstrap Band"
  };

  // Local Epidemiological & Environmental Covariates
  covariates: {
    cumulativeRainfallMm: number; // mm (14-day cumulative)
    avgTemperatureC: number;
    standingWaterSites: number;
    larvalBreteauIndex: number;
    heatIndexC: number;
    aqiLevel: number;
  };

  // Recommended SOP Actions
  recommendedPlaybooks: {
    id: number;
    code: string;
    title: string;
    urgency: "immediate" | "priority" | "routine";
  }[];
}
```

---

## 4. Frontend Route & Navigation Architecture

In [router.tsx](file:///d:/SILLAG-Project-1/system/src/frontend/src/app/router.tsx):

```tsx
// Forecasting Routes
{ path: "forecast", element: <Forecast /> },
{ path: "forecast/:locationId", element: <LocationForecastDetail /> },

// Surveillance Routes
{ path: "surveillance", element: <Surveillance /> },
{ path: "surveillance/:locationId", element: <LocationSurveillanceDetail /> },
```

---

## 5. UI & Interaction Design

### 5.1 Directory List Experience (`Forecast.tsx` & `Surveillance.tsx`)
1. **Header:** Title, live sentinel pipeline status badge, quick summary KPIs (Total Hotspot Barangays, High Risk Municipalities, Average Model Accuracy 93.8%).
2. **Search & Filter Control Bar:**
   - Search input: Type to filter by Barangay, Municipality, Province, or Disease name.
   - **Province Select:** Dropdown filter (All Provinces, La Union, Pangasinan, Ilocos Sur, Ilocos Norte).
   - **Municipality Select:** Cascading dropdown filter based on selected province.
   - **Disease Pills:** Filter by Dengue, Leptospirosis, Flu-like Illness (ILI), Bronchial Asthma.
   - **Risk Level Filter:** Filter by High Risk, Elevated Watch, Routine Baseline.
3. **Data Grid & Cards View:**
   - Cards/Table displaying geographic hierarchy, current case counts, change indicators, risk pills, and an "Examine Detail Trajectory →" button.

### 5.2 Location Detail View (`LocationForecastDetail.tsx`)
1. **Breadcrumb Bar:** Clickable breadcrumbs (`Forecast > La Union > San Fernando City > Brgy. Sevilla`) + Quick Actions (`Export Bulletin`, `Deploy Playbook`).
2. **Location Telemetry Header:**
   - Barangay, Municipality, Province.
   - Active disease badge with icon.
   - Current weekly count, population at risk, primary sentinel facility.
3. **Interactive Dual-Horizon Prediction Graph (SVG):**
   - **8 Historical Weeks:** High-contrast solid line with data points showing actual case counts.
   - **Current Week Marker:** Distinct vertical dotted demarcation line labeled *"Current Epidemic Week"*.
   - **4 Forecast Weeks:** Dashed trajectory line with glowing data dots.
   - **95% Confidence Interval Band:** Translucent shaded region highlighting upper and lower uncertainty bounds.
   - **Interactive Hover Tooltip:** Hovering any week displays:
     - Week number and date range.
     - Confirmed actual count (or "Predicted" for future).
     - Projected case range (CI lower – upper).
4. **Model Performance & Accuracy Scorecard:**
   - 4-metric badge bar:
     - **Forecast Accuracy:** `93.8%` (High Confidence)
     - **Error Rate (MAPE):** `5.8%`
     - **Fit ($R^2$ Score):** `0.91`
     - **Target Model:** `4-Layer Bi-LSTM with 3 Timestep Lags`
5. **Local Environmental Drivers & Playbook Actions:**
   - 14-day rainfall, ambient temperature, larval index, and standing water sites.
   - Direct button to deploy field SOP playbooks (e.g. targeted larviciding, fever clinics).

---

## 6. Implementation Plan & Phases

1. **Service Layer & Mock/Live Data Adapter:**
   - Create `src/frontend/src/services/forecast/api/locations.api.ts` with location directory queries and location detail generator following literature formulas.
   - Update `src/frontend/src/services/forecast/types/forecast.types.ts` with `LocationDiseaseEntry` and `LocationDetailData`.
2. **Reusable Dual-Horizon Prediction Graph Component:**
   - Create `src/frontend/src/features/forecasting/components/PredictionGraph.tsx` supporting SVG rendering, confidence ribbons, hover tooltips, and tabular data tables.
3. **Location Detail Pages:**
   - Build `src/frontend/src/features/forecasting/pages/LocationForecastDetail.tsx`.
   - Build `src/frontend/src/features/surveillance/pages/LocationSurveillanceDetail.tsx`.
4. **Directory Pages Overhaul:**
   - Refactor `src/frontend/src/features/forecasting/pages/Forecast.tsx` with search, province/municipality filters, and location disease cards.
   - Refactor `src/frontend/src/features/surveillance/pages/Surveillance.tsx` with location surveillance matrix and live feed telemetry.
5. **Routing Integration:**
   - Register routes in `src/frontend/src/app/router.tsx`.
6. **Verification & Testing:**
   - Verify with `npm run build` and `npm run test`.
   - Verify live API endpoints and n8n webhook compatibility.
