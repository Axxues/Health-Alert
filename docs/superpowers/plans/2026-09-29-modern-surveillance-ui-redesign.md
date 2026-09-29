# Modern Surveillance UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely modernize the Health Alert frontend across all 12 pages, shell navigation, typography, and iconography with an Electric Indigo & Deep Navy surveillance aesthetic.

**Architecture:** Vertical feature-slice architecture in `src/frontend/src/features/` with centralized layout shell (`src/frontend/src/layouts/`), design system tokens (`src/frontend/src/index.css`), Google Font Plus Jakarta Sans with tabular figures, and Lucide React icons.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, `react-router` 7, `lucide-react`, Vanilla CSS tokens.

**Spec:** `docs/superpowers/specs/2026-09-29-modern-surveillance-ui-redesign.md`

## Global Constraints
- Primary color: `#533afd` (Electric Indigo), `#0d253d` (Deep Navy), `#f8fafc` (Light canvas), `#0a0f1d` (Dark canvas).
- Font family: `Plus Jakarta Sans` loaded via Google Fonts with tabular figures (`tnum`).
- Icons: `lucide-react` only; eliminate all unicode icon symbols and raw inline SVGs.
- Absolute imports: `@/*` mapped to `src/*`.
- Type checking: `npm run build` (`tsc --noEmit && vite build`) must pass without errors after every task.

---

### Task 1: Package Dependencies & Typography Setup
**Files:**
- Modify: `src/frontend/package.json`
- Modify: `src/frontend/index.html`

- [ ] **Step 1: Install `lucide-react`**
  Run: `npm i lucide-react` in `src/frontend`
  Verify: `lucide-react` added to `dependencies` in `package.json`.

- [ ] **Step 2: Update `index.html` with Plus Jakarta Sans**
  Add Google Fonts preconnect and stylesheet links for `Plus Jakarta Sans:wght@400;500;600;700;800&display=swap` to `src/frontend/index.html`.

- [ ] **Step 3: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/package.json src/frontend/package-lock.json src/frontend/index.html; git commit -m "chore: add lucide-react and Plus Jakarta Sans font"`

---

### Task 2: Design System & Global CSS Overhaul
**Files:**
- Modify: `src/frontend/src/index.css`

- [ ] **Step 1: Overhaul CSS custom properties**
  Replace pine/cream palette with Electric Indigo (`#533afd`), Deep Navy (`#0d253d`), canvas-soft (`#f8fafc`), dark midnight (`#0a0f1d`), crisp card borders, and semantic status tokens (Critical `#ef4444`, Warning `#f59e0b`, Watch `#6366f1`, Safe `#10b981`, Sync `#06b6d4`).

- [ ] **Step 2: Update typography rules and animations**
  Set `font-family: 'Plus Jakarta Sans', system-ui, sans-serif;`. Add `.tabular { font-feature-settings: 'tnum', 'zero'; }`, glassmorphism utility classes (`.card-glass`), subtle pulse animations, and refined button pills.

- [ ] **Step 3: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/src/index.css; git commit -m "style: overhaul design tokens and typography for modern surveillance theme"`

---

### Task 3: Shell & Navigation Modernization (TopBar & Sidebar)
**Files:**
- Modify: `src/frontend/src/layouts/Layout.tsx`
- Modify: `src/frontend/src/layouts/Sidebar.tsx`
- Modify: `src/frontend/src/constants/layout/menu/menu.tsx`
- Modify: `src/frontend/src/components/shared/ThemeToggle.tsx`

- [ ] **Step 1: Update `menu.tsx` with Medicine and reorganization**
  Restructure navigation into 3 sections: `Epidemiology`, `Outbreak Response`, and `Administration`. Add `{ name: "Medicine & Supplies", path: "/medicine", section: "Outbreak Response" }`.

- [ ] **Step 2: Overhaul `Sidebar.tsx` with Lucide icons**
  Import Lucide icons (`LayoutDashboard`, `TrendingUp`, `Radio`, `MapPin`, `BookOpenCheck`, `Workflow`, `BellRing`, `UsersRound`, `Pill`, `FileBarChart`, `MessageSquare`, `UserCheck`, `Cpu`). Replace rough SVG icons with modern Lucide icons and active illuminated indicator styling.

- [ ] **Step 3: Overhaul `Layout.tsx` and `ThemeToggle.tsx`**
  Add live surveillance telemetry indicator (`● LIVE SYNC`), search command shortcut badge (`⌘K`), Lucide notification bell with pulsing badge, and modern profile dropdown. Update `ThemeToggle.tsx` with Lucide `Sun` and `Moon`.

- [ ] **Step 4: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add src/frontend/src/layouts/ src/frontend/src/constants/layout/ src/frontend/src/components/shared/ThemeToggle.tsx; git commit -m "feat: modernize layout shell and sidebar with Lucide icons"`

---

### Task 4: Modernize Dashboard Feature
**Files:**
- Modify: `src/frontend/src/features/dashboard/pages/Dashboard.tsx`
- Modify: `src/frontend/src/features/dashboard/components/StatCards.tsx`
- Modify: `src/frontend/src/features/dashboard/components/ActNowCard.tsx`
- Modify: `src/frontend/src/features/dashboard/components/WeekBars.tsx`
- Modify: `src/frontend/src/features/dashboard/components/AlertsCard.tsx`
- Modify: `src/frontend/src/features/dashboard/components/PlaybooksCard.tsx`

- [ ] **Step 1: Enhance `StatCards.tsx` and `WeekBars.tsx`**
  Add Lucide icons, trend badges (`+2 vs last week`), tabular figure counters, and color-graded severity bars for top hotspot municipalities.

- [ ] **Step 2: Elevate `ActNowCard.tsx`, `AlertsCard.tsx`, and `Dashboard.tsx`**
  Modernize the top threat callout card with deep navy gradient, driving factor chips, and one-click playbook execution. Add triage alerts feed with Lucide status icons.

- [ ] **Step 3: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/src/features/dashboard/; git commit -m "feat: elevate dashboard command center with modern telemetry widgets"`

---

### Task 5: Modernize Forecast Feature
**Files:**
- Modify: `src/frontend/src/features/forecasting/pages/Forecast.tsx`
- Modify: `src/frontend/src/features/forecasting/components/ForecastToolbar.tsx`
- Modify: `src/frontend/src/features/forecasting/components/OutlookCard.tsx`

- [ ] **Step 1: Overhaul `ForecastToolbar.tsx`**
  Add disease tabs (Dengue, Leptospirosis, ILI, Asthma) with disease icons and active states, plus a modern "Simulate Forecast" trigger button.

- [ ] **Step 2: Overhaul `OutlookCard.tsx`**
  Convert the bland single-number card into an epidemiological forecast card: large radial/bar probability gauge, risk band badge, environmental driver chips (Rainfall, Temp, Search Spikes), and 2-to-4 week trajectory forecast.

- [ ] **Step 3: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/src/features/forecasting/; git commit -m "feat: redesign forecast view with probability gauge and driver chips"`

---

### Task 6: Modernize Surveillance & Risk Maps Features
**Files:**
- Modify: `src/frontend/src/features/surveillance/pages/Surveillance.tsx`
- Modify: `src/frontend/src/features/surveillance/components/FeedTable.tsx`
- Modify: `src/frontend/src/features/risk-maps/pages/RiskMaps.tsx`
- Modify: `src/frontend/src/features/risk-maps/components/PHMap.tsx`

- [ ] **Step 1: Redesign `Surveillance.tsx` and `FeedTable.tsx`**
  Add surveillance feed KPI summary cards (Ingested Records 24h, Active Feeds, Latency, Anomaly Flags). Add status pills, filter tabs, and sync timestamps to `FeedTable`.

- [ ] **Step 2: Redesign `RiskMaps.tsx` and `PHMap.tsx`**
  Add disease filter chips, glowing map markers with pulse rings, and an elevated glass slide-over drawer showing detailed barangay hazard factors, coordinates, and playbook quick-triggers.

- [ ] **Step 3: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/src/features/surveillance/ src/frontend/src/features/risk-maps/; git commit -m "feat: modernize surveillance feeds table and geospatial risk maps"`

---

### Task 7: Modernize Response & Intelligence (Ask Library, Playbooks, Alerts, Citizen)
**Files:**
- Modify: `src/frontend/src/features/rag/pages/Rag.tsx`
- Modify: `src/frontend/src/features/playbooks/pages/Playbooks.tsx`
- Modify: `src/frontend/src/features/alerts/pages/Alerts.tsx`
- Modify: `src/frontend/src/features/citizen/pages/Citizen.tsx`

- [ ] **Step 1: Redesign `Rag.tsx` (Ask the Library)**
  Transform into an AI epidemiology assistant: literature prompt suggestion chips, chat stream, cited literature cards with page badges.

- [ ] **Step 2: Redesign `Playbooks.tsx` and `Alerts.tsx`**
  Add structured SOP cards with interactive step checklists, execution history, and modal confirmations. Elevate `Alerts.tsx` with severity filters and broadcast action buttons.

- [ ] **Step 3: Redesign `Citizen.tsx`**
  Modernize the public-facing bilingual symptom triage portal with urgency badge outcomes (Emergency, RHU Clinic, Home Monitoring) and health advisories.

- [ ] **Step 4: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add src/frontend/src/features/rag/ src/frontend/src/features/playbooks/ src/frontend/src/features/alerts/ src/frontend/src/features/citizen/; git commit -m "feat: modernize Ask Library, Playbooks, Alerts, and Citizen portals"`

---

### Task 8: Implement Medicine & Supplies Module
**Files:**
- Create: `src/frontend/src/features/medicine/pages/Medicine.tsx`
- Create: `src/frontend/src/features/medicine/components/StockpileCard.tsx`
- Create: `src/frontend/src/features/medicine/components/SupplyTable.tsx`
- Create: `src/frontend/src/features/medicine/components/RequisitionModal.tsx`

- [ ] **Step 1: Build medicine components**
  Implement stockpile health cards, inventory table (ORS, Doxycycline, IV Fluids, Dengue NS1 tests, Salbutamol, Paracetamol), expiry alerts, and requisition modal.

- [ ] **Step 2: Build `Medicine.tsx` page**
  Assemble components with filter tabs, burn-down rate indicators correlated to disease forecasts, and restock actions.

- [ ] **Step 3: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/src/features/medicine/; git commit -m "feat: implement Medicine & Supplies stockpile inventory feature"`

---

### Task 9: Implement Governance & Administration Pages (Reports, Users, System)
**Files:**
- Create: `src/frontend/src/features/reports/pages/Reports.tsx`
- Create: `src/frontend/src/features/users/pages/Users.tsx`
- Create: `src/frontend/src/features/system/pages/System.tsx`

- [ ] **Step 1: Build `Reports.tsx`**
  Implement Weekly Epidemiological Surveillance Report (WESR) generator, morbidity tables, and PDF/CSV export cards.

- [ ] **Step 2: Build `Users.tsx`**
  Implement user directory with role badges (MHO, Epidemiologist, BHW Lead, Admin), status chips, and Add Officer modal.

- [ ] **Step 3: Build `System.tsx`**
  Implement system diagnostics (EDCS sync health, SignalR live status, Cron job scheduler, and immutable audit logs).

- [ ] **Step 4: Verify build**
  Run: `npm run build` in `src/frontend`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add src/frontend/src/features/reports/ src/frontend/src/features/users/ src/frontend/src/features/system/; git commit -m "feat: implement Reports, Users, and System diagnostics pages"`

---

### Task 10: Router Integration & End-to-End Verification
**Files:**
- Modify: `src/frontend/src/app/router.tsx`

- [ ] **Step 1: Wire up new pages in `router.tsx`**
  Connect `Medicine`, `Reports`, `Users`, and `System` routes replacing old placeholders.

- [ ] **Step 2: Run complete frontend build**
  Run: `npm run build` in `src/frontend`
  Expected: 0 errors.

- [ ] **Step 3: Run vitest suite**
  Run: `npm run test` in `src/frontend`
  Expected: All tests pass.

- [ ] **Step 4: Commit**
  Run: `git add src/frontend/src/app/router.tsx; git commit -m "feat: connect all pages to router and complete modern redesign"`
