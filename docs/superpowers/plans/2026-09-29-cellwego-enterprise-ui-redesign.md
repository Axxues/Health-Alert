# Cellwego Enterprise UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the HealthAlert system UI across all pages and layouts, copying the calm, professional, enterprise B2B SaaS design system from `D:\cellwego\Frontend\Admin` to eliminate overly colorful and unprofessional elements.

**Architecture:** Replace the high-contrast neon styling in `index.css` with Cellwego's HSL tokens, neutral slate dark mode, `border-l-4` summary cards, soft 10%-tinted status badges, clean `DashboardSectionCard` headers, and subdued data tables. Apply these unified patterns across every page and the layout shell.

**Tech Stack:** React 19, React Router v7, Lucide React, Vite, Vitest, Vanilla CSS design system with HSL variables.

**Spec:** `docs/superpowers/specs/2026-09-29-cellwego-enterprise-ui-redesign.md`

## Global Constraints

- Mirror `D:\cellwego\Frontend\Admin` visual design: calm slate palette, `border-l-4` summary cards, soft badges, `rounded-2xl` cards.
- Remove all bright saturated radial gradients, neon glows, and high-contrast multi-colored cards.
- Preserve all existing functionality, real-time feeds, filters, navigation, and API service contracts.
- Support both Light Mode (`#f8fafc`) and Dark Mode (`#111726`) seamlessly.
- Zero TypeScript (`tsc --noEmit`) and Vite bundling errors on `npm run build`.
- All tests in `npm run test` must remain 100% green.

---

### Task 1: Global Theme & Core CSS Redesign (`index.css`)

**Files:**
- Modify: `src/frontend/src/index.css`
- Test: `src/frontend/src/index.css` (visual/token verification)

**Interfaces:**
- Produces: Cellwego HSL tokens (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`, `--success`, `--warning`, `--destructive`), `.card`, `.stat-card` with `border-l-4`, `.badge` (soft 10% fills), `.data-table`, `.button`, `.input`.

- [ ] **Step 1: Replace root and dark mode color variables in index.css with Cellwego tokens**

Update `:root` and `[data-theme="dark"]` to:
- Background: `220 14% 97.5%` (light) / `220 29% 10%` (dark)
- Foreground: `222.2 84% 5%` (light) / `210 40% 96%` (dark)
- Card: `0 0% 100%` (light) / `220 29% 12%` (dark)
- Card Hover: `220 14% 95%` (light) / `217 19% 18%` (dark)
- Primary: `221 83% 55%` (light) / `217 91% 60%` (dark)
- Muted: `210 40% 96.1%` (light) / `217.2 32.6% 17.5%` (dark)
- Border: `214.3 31.8% 91.4%` (light) / `217 19% 20%` (dark)
- Soft semantic status colors: `--success`, `--warning`, `--destructive`, `--info`.

- [ ] **Step 2: Add Cellwego core utility classes**

Add:
- `.card` with `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `box-shadow: 0 1px 3px rgba(0,0,0,0.05)`.
- `.section-card` with `header` having `border-bottom: 1px solid var(--border)` and `background: var(--muted)`.
- `.stat-card` with `border-l-4` support (`.border-l-primary`, `.border-l-success`, `.border-l-warning`, `.border-l-destructive`).
- `.badge` with soft 10% backgrounds: `.badge--success`, `.badge--warning`, `.badge--destructive`, `.badge--info`, `.badge--muted`.
- Clean `.data-table` styling matching Cellwego's `table.tsx`.
- Subtle custom scrollbar matching Cellwego.

- [ ] **Step 3: Run build to verify CSS syntax**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/index.css
git commit -m "feat: adopt Cellwego design system tokens and core styles"
```

---

### Task 2: Layout Shell Overhaul (`Layout.tsx`, Navbar & Sidebar)

**Files:**
- Modify: `src/frontend/src/layouts/Layout.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `router`, navigation items.
- Produces: Clean 64px glass navbar, collapsible slate sidebar with floating toggle, professional profile modal.

- [ ] **Step 1: Overhaul Layout.tsx Navbar**

Update topbar to:
- Fixed 64px height (`h-16`), subtle border `border-border/60`, glass blur.
- Minimalist brand shield and clean text `HealthAlert`.
- Refined search bar with `⌘K` keyboard badge.
- Live stream indicator with subtle green pulse dot.
- Theme toggle and clean profile trigger.

- [ ] **Step 2: Overhaul Layout.tsx Sidebar**

Update sidebar to:
- Calm slate background `bg-background/95 border-r border-border/60`.
- Floating circular collapse toggle button (`PanelLeftClose` / `PanelLeftOpen`).
- Nav links with quiet hover state (`hover:bg-muted text-muted-foreground hover:text-foreground`).
- Active link styled with `bg-primary/10 text-primary font-semibold rounded-xl`.

- [ ] **Step 3: Overhaul Profile Modal**

Clean up profile dialog:
- Clean Shadcn card styling, user avatar, metadata, logout button.
- Ensure no outdated session tags or high-contrast borders.

- [ ] **Step 4: Run build to verify compilation**

Run: `npm run build`  
Expected: PASS with 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/layouts/Layout.tsx
git commit -m "feat: redesign Layout shell with Cellwego navbar and sidebar"
```

---

### Task 3: Dashboard Redesign (`Dashboard.tsx`)

**Files:**
- Modify: `src/frontend/src/features/dashboard/pages/Dashboard.tsx`

**Interfaces:**
- Produces: Executive dashboard with `DashboardSummaryCards` (`border-l-4`), `DashboardSectionCard` containers, and subdued tabular feeds.

- [ ] **Step 1: Replace colorful metric cards with Cellwego Summary Cards**

Transform the 4 top KPI cards:
- Total Cases: `border-l-4 border-l-blue-500`, soft blue icon badge `bg-primary/10 text-primary`.
- High Risk Zones: `border-l-4 border-l-rose-500`, soft red icon badge `bg-destructive/10 text-destructive`.
- Outbreak Surge Alerts: `border-l-4 border-l-amber-500`, soft amber icon badge `bg-warning/10 text-warning`.
- Early Detection Lead Time: `border-l-4 border-l-emerald-500`, soft green icon badge `bg-success/10 text-success`.

- [ ] **Step 2: Implement DashboardSectionCard layout**

Wrap dashboard widgets:
- Section headers with `px-6 py-4 border-b border-border bg-muted/40 font-bold text-foreground text-base`.
- Clean outbreak bar chart with calm monochrome/blue bars and subtle hover.
- Subdued recent alert list with soft badges.
- Live syndromic stream with quiet timestamps.

- [ ] **Step 3: Run build to verify TypeScript compilation**

Run: `npm run build`  
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/features/dashboard/pages/Dashboard.tsx
git commit -m "feat: overhaul Dashboard with Cellwego section cards and summary cards"
```

---

### Task 4: Forecasting & Surveillance Redesign

**Files:**
- Modify: `src/frontend/src/features/forecasting/pages/Forecast.tsx`
- Modify: `src/frontend/src/features/forecasting/pages/LocationForecastDetail.tsx`
- Modify: `src/frontend/src/features/forecasting/components/PredictionGraph.tsx`
- Modify: `src/frontend/src/features/surveillance/pages/Surveillance.tsx`
- Modify: `src/frontend/src/features/surveillance/pages/LocationSurveillanceDetail.tsx`

**Interfaces:**
- Produces: Calm, executive location disease directories and professional prediction trajectories without garish neons.

- [ ] **Step 1: Refine PredictionGraph.tsx**

Update SVG prediction graph:
- Use calm slate-blue (`var(--primary)`) for 8-week historical actuals.
- Use warm amber (`var(--warning)`) for 4-week future projections.
- Soft slate tint (`rgba(59, 130, 246, 0.08)`) for 95% confidence interval area.
- Replace bright metric badges with Cellwego quiet scorecard (`bg-muted/40 border border-border`).

- [ ] **Step 2: Redesign Forecast.tsx & LocationForecastDetail.tsx**

- Apply `border-l-4` to location cards in `Forecast.tsx`.
- Replace saturated filter buttons with clean muted pills (`bg-muted hover:bg-muted/80`).
- Update `LocationForecastDetail.tsx` with clean `DashboardSectionCard` layout, calm environmental covariates, and refined SOP buttons.

- [ ] **Step 3: Redesign Surveillance.tsx & LocationSurveillanceDetail.tsx**

- Update surveillance telemetry metrics to Cellwego summary cards.
- Restyle the monitored sentinel table and clinical intake logs with Cellwego table styles.
- Update `LocationSurveillanceDetail.tsx` header banner and logs.

- [ ] **Step 4: Run tests & build**

Run: `npm run test && npm run build`  
Expected: All 13 tests pass, build 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/features/forecasting src/frontend/src/features/surveillance
git commit -m "feat: redesign Forecast and Surveillance pages with Cellwego aesthetic"
```

---

### Task 5: Operational & Admin Pages Redesign

**Files:**
- Modify: `src/frontend/src/features/risk-maps/pages/RiskMaps.tsx`
- Modify: `src/frontend/src/features/rag/pages/Rag.tsx`
- Modify: `src/frontend/src/features/playbooks/pages/Playbooks.tsx`
- Modify: `src/frontend/src/features/alerts/pages/Alerts.tsx`
- Modify: `src/frontend/src/features/medicine/pages/Medicine.tsx`
- Modify: `src/frontend/src/features/reports/pages/Reports.tsx`
- Modify: `src/frontend/src/features/users/pages/Users.tsx`
- Modify: `src/frontend/src/features/system/pages/System.tsx`
- Modify: `src/frontend/src/features/citizen/pages/Citizen.tsx`
- Modify: `src/frontend/src/features/auth/pages/Login.tsx`

**Interfaces:**
- Produces: Complete system-wide visual consistency where every remaining page matches Cellwego.

- [ ] **Step 1: Redesign RiskMaps.tsx & Rag.tsx (Ask Library)**

- `RiskMaps.tsx`: Style sidebar as clean Cellwego slide-over panel; clean severity legend with soft badges.
- `Rag.tsx`: Style chat interface cleanly with quiet message bubbles, subtle citation tags, and minimalist input box.

- [ ] **Step 2: Redesign Playbooks.tsx & Alerts.tsx**

- `Playbooks.tsx`: Clean SOP cards with soft urgency badges (`bg-warning/10`, `bg-destructive/10`), structured step checklist.
- `Alerts.tsx`: Professional incident management feed with quiet timestamps and structured triage actions.

- [ ] **Step 3: Redesign Medicine.tsx, Reports.tsx, Users.tsx, System.tsx, Citizen.tsx, Login.tsx**

- `Medicine.tsx`: Clean inventory table matching Cellwego warehouse inventory tables.
- `Reports.tsx`: Clean report generation form and download table.
- `Users.tsx` & `System.tsx`: Clean user RBAC table and system diagnostics cards.
- `Citizen.tsx`: Clean citizen report triage directory.
- `Login.tsx`: Clean centered enterprise authentication card.

- [ ] **Step 4: Run build to verify compilation**

Run: `npm run build`  
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/features
git commit -m "feat: standardize RiskMaps, Rag, Playbooks, Alerts, and Admin pages to Cellwego design"
```

---

### Task 6: Comprehensive Verification & Polish

**Files:**
- Verify: Full frontend suite

- [ ] **Step 1: Run comprehensive test suite**

Run: `npm run test`  
Expected: PASS (all tests pass)

- [ ] **Step 2: Run production bundle build**

Run: `npm run build`  
Expected: PASS (0 TypeScript and bundling errors)

- [ ] **Step 3: Visual inspection**

Verify in browser across desktop and mobile, light and dark themes.

- [ ] **Step 4: Final commit**

```bash
git commit -m "feat: complete Cellwego enterprise UI redesign across all pages"
```
