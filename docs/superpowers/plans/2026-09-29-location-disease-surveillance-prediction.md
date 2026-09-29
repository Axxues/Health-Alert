# Location-Based Disease Surveillance & Predictive Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Forecast and Surveillance modules into a location-based disease directory with multi-tier geographic filters (province, municipality, disease), interactive search, and dedicated location detail pages with dual-horizon (8 weeks historical actuals vs 4 weeks future predictions) SVG charts and model accuracy scoring.

**Architecture:** A centralized location intelligence service adapter connects to backend APIs and automated n8n feeds. The frontend provides filterable directory views (`/forecast`, `/surveillance`) that drill down into dedicated master-detail routes (`/forecast/:locationId`, `/surveillance/:locationId`) featuring rich SVG time-series visualizations with 95% confidence intervals and Bi-LSTM accuracy scorecards.

**Tech Stack:** React 19, TypeScript, Vite 7, react-router v7, Lucide Icons, Vanilla CSS design tokens.

**Spec:** [docs/superpowers/specs/2026-09-29-location-disease-surveillance-prediction-design.md](file:///d:/SILLAG-Project-1/system/docs/superpowers/specs/2026-09-29-location-disease-surveillance-prediction-design.md)

## Global Constraints
- Target paths: `src/frontend/src/features/forecasting`, `src/frontend/src/features/surveillance`, `src/frontend/src/services/forecast`, `src/frontend/src/app/router.tsx`, `src/frontend/src/index.css`.
- Path aliases: `@/*` maps to `src/*`, absolute imports only.
- Strict TypeScript: zero compilation errors (`tsc --noEmit`).
- No placeholders, no generic AI styling — adhere to Obsidian Graphite dark mode tokens.

---

### Task 1: Location Disease Data Contracts & Service Layer

**Files:**
- Modify: `src/frontend/src/services/forecast/types/forecast.types.ts`
- Create: `src/frontend/src/services/forecast/api/locations.api.ts`
- Create: `src/frontend/src/services/forecast/api/locations.api.test.ts`

**Interfaces:**
- Produces:
  - `LocationDiseaseEntry`: Summary location item for directory list.
  - `LocationDetailData`: Full location telemetry with 8 past weeks and 4 future weeks.
  - `listLocations(filter)`: Promise returning filtered `LocationDiseaseEntry[]`.
  - `getLocationDetail(id, disease)`: Promise returning `LocationDetailData`.

- [ ] **Step 1: Write unit test for locations API service**

```typescript
// src/frontend/src/services/forecast/api/locations.api.test.ts
import { describe, it, expect } from "vitest";
import { listLocations, getLocationDetail } from "./locations.api";

describe("locations.api", () => {
  it("returns filtered list of disease locations", async () => {
    const all = await listLocations({});
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toHaveProperty("province");
    expect(all[0]).toHaveProperty("municipality");
    expect(all[0]).toHaveProperty("barangay");
    expect(all[0]).toHaveProperty("activeCases");
  });

  it("filters locations by province", async () => {
    const lu = await listLocations({ province: "La Union" });
    expect(lu.every((l) => l.province === "La Union")).toBe(true);
  });

  it("returns location detail with 8 past weeks and 4 future weeks", async () => {
    const detail = await getLocationDetail("lu-sfc-sevilla", "dengue");
    expect(detail).toBeDefined();
    expect(detail.timeline.length).toBe(12);
    const past = detail.timeline.filter((w) => !w.isFuture);
    const future = detail.timeline.filter((w) => w.isFuture);
    expect(past.length).toBe(8);
    expect(future.length).toBe(4);
    expect(detail.accuracyMetrics.accuracyRate).toBeGreaterThan(85);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/services/forecast/api/locations.api.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Define types and implement location service**

Update `src/frontend/src/services/forecast/types/forecast.types.ts`:
```typescript
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
}

export interface TimelineWeek {
  weekNumber: number;
  weekLabel: string;
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
    accuracyRate: number;
    mape: number;
    r2Score: number;
    aucRoc: number;
    confidenceMethod: string;
  };
  covariates: {
    cumulativeRainfallMm: number;
    avgTemperatureC: number;
    standingWaterSites: number;
    larvalBreteauIndex: number;
    heatIndexC: number;
    aqiLevel: number;
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
```

Implement `src/frontend/src/services/forecast/api/locations.api.ts` with API query and dynamic telemetry computation based on `HealthAlert_FullSystem_Data_Literature_Rev2.docx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/services/forecast/api/locations.api.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/services/forecast
git commit -m "feat: add location disease data contracts and service layer"
```

---

### Task 2: Dual-Horizon Prediction Graph Component (SVG)

**Files:**
- Create: `src/frontend/src/features/forecasting/components/PredictionGraph.tsx`
- Create: `src/frontend/src/features/forecasting/components/PredictionGraph.test.tsx`
- Modify: `src/frontend/src/index.css` (add prediction chart styles)

**Interfaces:**
- Consumes: `TimelineWeek[]`, `accuracyMetrics`.
- Produces: `<PredictionGraph timeline={timeline} metrics={accuracyMetrics} diseaseName={diseaseName} />`.

- [ ] **Step 1: Write unit test for PredictionGraph component**

```typescript
// src/frontend/src/features/forecasting/components/PredictionGraph.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PredictionGraph } from "./PredictionGraph";
import type { TimelineWeek } from "@/services/forecast/types/forecast.types";

const mockTimeline: TimelineWeek[] = [
  { weekNumber: 31, weekLabel: "W31 (Aug 4)", isFuture: false, actualCases: 12, predictedCases: 11, ciLower: 9, ciUpper: 14 },
  { weekNumber: 32, weekLabel: "W32 (Aug 11)", isFuture: false, actualCases: 18, predictedCases: 17, ciLower: 14, ciUpper: 21 },
  { weekNumber: 33, weekLabel: "W33 (Aug 18)", isFuture: true, actualCases: null, predictedCases: 25, ciLower: 20, ciUpper: 30 },
];

const mockMetrics = {
  modelName: "Bi-LSTM Neural Engine",
  accuracyRate: 93.8,
  mape: 5.8,
  r2Score: 0.91,
  aucRoc: 0.92,
  confidenceMethod: "95% Empirical Bootstrap Band",
};

describe("PredictionGraph", () => {
  it("renders accuracy scorecard and chart legend", () => {
    render(<PredictionGraph timeline={mockTimeline} metrics={mockMetrics} diseaseName="Dengue" />);
    expect(screen.getByText("93.8%")).toBeDefined();
    expect(screen.getByText(/Bi-LSTM Neural Engine/i)).toBeDefined();
    expect(screen.getByText(/5.8%/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/forecasting/components/PredictionGraph.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Implement PredictionGraph component with interactive SVG**

Create `src/frontend/src/features/forecasting/components/PredictionGraph.tsx`:
- Render 4-metric accuracy banner (`Accuracy Rate`, `MAPE`, `R² Score`, `Model Name`).
- SVG viewBox responsive charting:
  - 95% Confidence Interval polygon `<polygon points="..." fill="rgba(82, 93, 249, 0.12)" />`.
  - Historical Actuals line: `<path d="..." stroke="var(--primary)" strokeWidth="3" />` with filled data points.
  - Demarcation line: `<line stroke="var(--mute)" strokeDasharray="4 4" />` with label *"Current Week"*.
  - Forecast Projections line: `<path d="..." stroke="var(--amber)" strokeWidth="3" strokeDasharray="6 4" />` with glowing circles.
  - Interactive tooltip overlay displaying exact actual, predicted, and confidence bounds on hover.
  - Detailed weekly tabular data view toggle.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/forecasting/components/PredictionGraph.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/features/forecasting/components src/frontend/src/index.css
git commit -m "feat: implement dual-horizon SVG prediction graph with accuracy scorecard"
```

---

### Task 3: Location Detail Pages (`LocationForecastDetail` & `LocationSurveillanceDetail`)

**Files:**
- Create: `src/frontend/src/features/forecasting/pages/LocationForecastDetail.tsx`
- Create: `src/frontend/src/features/surveillance/pages/LocationSurveillanceDetail.tsx`

**Interfaces:**
- Consumes: `useParams<{ locationId: string }>()`, `getLocationDetail(id, disease)`.
- Produces: Dedicated master-detail page with breadcrumbs, environmental covariates, PredictionGraph, and local response playbooks.

- [ ] **Step 1: Implement LocationForecastDetail page**

Build `src/frontend/src/features/forecasting/pages/LocationForecastDetail.tsx`:
- Fetch location detail with loading skeleton and error boundary.
- Header with clickable breadcrumb (`Forecast > Province > Municipality > Barangay`).
- Key metrics banner (Current Cases, Forecast Peak, Population at Risk, Primary Hospital).
- Embed `<PredictionGraph />`.
- Environmental covariates panel (Rainfall, Temp, Larval Index, Standing Water).
- Direct playbook action trigger ("Deploy Local Intervention SOP").

- [ ] **Step 2: Implement LocationSurveillanceDetail page**

Build `src/frontend/src/features/surveillance/pages/LocationSurveillanceDetail.tsx`:
- Focused on real-time surveillance signals, clinical intake feeds, and historical weekly counts.

- [ ] **Step 3: Run build to verify types**

Run: `npm run build`  
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/features/forecasting/pages src/frontend/src/features/surveillance/pages
git commit -m "feat: implement location detail pages with dual-horizon telemetry"
```

---

### Task 4: Location Disease Directory Overhaul (`Forecast.tsx` & `Surveillance.tsx`)

**Files:**
- Modify: `src/frontend/src/features/forecasting/pages/Forecast.tsx`
- Modify: `src/frontend/src/features/surveillance/pages/Surveillance.tsx`

**Interfaces:**
- Produces: Searchable, filterable location disease directories with links navigating to detail pages.

- [ ] **Step 1: Overhaul Forecast.tsx**

Replace static outlook cards with:
- Executive directory header + live sentinel status.
- Real-time search bar (`Search barangay, municipality, province...`).
- Geographic filters:
  - Province dropdown (`All Provinces`, `La Union`, `Pangasinan`, `Ilocos Sur`, `Ilocos Norte`).
  - Municipality dropdown (cascades with selected province).
  - Disease pills (`Dengue`, `Leptospirosis`, `ILI`, `Asthma`).
  - Risk level filter (`High Risk`, `Elevated Watch`, `Routine Baseline`).
- Filtered location cards grid with case counts, trend indicators, probability meters, and "Examine Trajectory →" buttons linking to `/forecast/:locationId`.

- [ ] **Step 2: Overhaul Surveillance.tsx**

Update `Surveillance.tsx` with:
- Surveillance feed telemetry metrics (24h Ingested Records, Ingestion Latency, Active Pipelines).
- Location Surveillance Matrix: Searchable table/card directory of monitored barangays with active clinical intake, case counts, and link to `/surveillance/:locationId`.

- [ ] **Step 3: Run build to verify TypeScript compilation**

Run: `npm run build`  
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/features/forecasting/pages/Forecast.tsx src/frontend/src/features/surveillance/pages/Surveillance.tsx
git commit -m "feat: overhaul Forecast and Surveillance pages with location disease directory"
```

---

### Task 5: Routing, Styling & End-to-End Verification

**Files:**
- Modify: `src/frontend/src/app/router.tsx`
- Modify: `src/frontend/src/index.css`

- [ ] **Step 1: Register detail routes in router.tsx**

Add routes:
- `/forecast/:locationId` -> `LocationForecastDetail`
- `/surveillance/:locationId` -> `LocationSurveillanceDetail`

- [ ] **Step 2: Style location filters, breadcrumbs, and chart tooltips in index.css**

Ensure responsive layout across desktop and mobile, with full Obsidian Graphite dark mode tokens.

- [ ] **Step 3: Run comprehensive verification**

Run: `npm run build`  
Expected: PASS with 0 errors.

Run: `npm run test`  
Expected: All tests pass.

- [ ] **Step 4: Commit and finalize**

```bash
git add src/frontend/src/app/router.tsx src/frontend/src/index.css
git commit -m "feat: complete location disease surveillance and prediction graph routing"
```
