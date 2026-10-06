# Health Alert / BantayHealthAI System-Wide Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Health Alert frontend into a high-density, unified epidemiological command center inspired by Linear and Datadog, replacing all ad-hoc inline styles with a reusable UI component library and overhauling layouts across all 9 pages.

**Architecture:** Build a shared `@/components/ui/` primitives layer and refine CSS design tokens in `index.css`. Restructure the global application shell (`Layout.tsx`, `Sidebar.tsx`) with 3 semantic navigation clusters and a global `CommandPalette` (⌘K). Systematically refactor all page layouts (`Dashboard`, `Intelligence`, `LocationDetail`, `RiskMaps`, `Alerts`, `Reports`, `Uploads`, `Users`, and `Login`) into high-density clinical telemetry workspaces.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, Tailwind CSS 3.4, Lucide React, Leaflet, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-06-system-wide-page-layouts-redesign.md`](file:///d:/SILLAG-Project-1/system/docs/superpowers/specs/2026-10-06-system-wide-page-layouts-redesign.md)

## Global Constraints
- Target workspace: `d:\SILLAG-Project-1\system\src\frontend`.
- Zero inline styles (`style={{ ... }}`) allowed in components or pages; use Tailwind utility classes and CSS variables.
- Maintain existing API contract functions in `@/services/*` without breaking data payloads or route guards.
- All numbers representing counts, rates, percentages, and timestamps must use tabular font alignment (`tabular-nums font-mono` or `font-variant-numeric: tabular-nums`).
- All tests in `npm run test` must stay green after every task.

---

### Task 1: Design Tokens & UI Primitives Foundation

**Files:**
- Modify: `src/frontend/src/index.css`
- Create: `src/frontend/src/components/ui/Button.tsx`
- Create: `src/frontend/src/components/ui/Card.tsx`
- Create: `src/frontend/src/components/ui/Badge.tsx`
- Create: `src/frontend/src/components/ui/Table.tsx`
- Create: `src/frontend/src/components/ui/Dialog.tsx`
- Create: `src/frontend/src/components/ui/Tabs.tsx`
- Create: `src/frontend/src/components/ui/Input.tsx`
- Create: `src/frontend/src/components/ui/Select.tsx`
- Create: `src/frontend/src/components/ui/MetricCard.tsx`
- Create: `src/frontend/src/components/ui/PageHeader.tsx`
- Create: `src/frontend/src/components/ui/Skeleton.tsx`
- Create: `src/frontend/src/components/ui/index.ts`
- Test: `src/frontend/src/components/ui/ui.test.tsx`

**Interfaces:**
- Produces:
  - `Button`: `({ variant, size, loading, ...props }: ButtonProps) => JSX.Element`
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - `Badge`: `({ variant, pulse, ...props }: BadgeProps) => JSX.Element`
  - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableEmpty`
  - `Dialog`: `({ open, onClose, title, description, children, footer }: DialogProps) => JSX.Element`
  - `Tabs`: `({ tabs, activeTab, onChange }: TabsProps) => JSX.Element`
  - `Input`: `(props: InputProps) => JSX.Element`
  - `Select`: `(props: SelectProps) => JSX.Element`
  - `MetricCard`: `({ title, value, subtitle, trend, icon }: MetricCardProps) => JSX.Element`
  - `PageHeader`: `({ title, description, badge, breadcrumbs, actions }: PageHeaderProps) => JSX.Element`
  - `Skeleton`: `({ className }: SkeletonProps) => JSX.Element`

- [ ] **Step 1: Write test for UI primitives**
Create `src/frontend/src/components/ui/ui.test.tsx` testing rendering of `Button`, `Badge`, `MetricCard`, and `PageHeader`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm --prefix src/frontend test src/frontend/src/components/ui/ui.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Update `src/frontend/src/index.css` with refined tokens**
Add utility classes, tabular numbers rule, pulse animation, and sleek scrollbar styles.

- [ ] **Step 4: Implement UI primitive components in `src/frontend/src/components/ui/`**
Implement `Button`, `Card`, `Badge`, `Table`, `Dialog`, `Tabs`, `Input`, `Select`, `MetricCard`, `PageHeader`, `Skeleton`, and barrel export in `index.ts`.

- [ ] **Step 5: Run UI test to verify it passes**
Run: `npm --prefix src/frontend test src/frontend/src/components/ui/ui.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/index.css src/frontend/src/components/ui/
git commit -m "feat(ui): add high-density design tokens and modular UI primitives"
```

---

### Task 2: Global Shell, Navigation & Command Palette

**Files:**
- Create: `src/frontend/src/components/ui/CommandPalette.tsx`
- Modify: `src/frontend/src/constants/layout/menu/menu.tsx`
- Modify: `src/frontend/src/layouts/Sidebar.tsx`
- Modify: `src/frontend/src/layouts/Layout.tsx`

**Interfaces:**
- Consumes: `Button`, `Badge`, `Dialog`, `Input` from `@/components/ui`
- Produces:
  - `CommandPalette`: `({ open, onClose }: CommandPaletteProps) => JSX.Element`
  - `Sidebar`: `({ items, collapsed, onToggleCollapse }: SidebarProps) => JSX.Element`
  - `Layout`: Main application shell with breadcrumbs, command palette listener, and Guidelines assistant drawer.

- [ ] **Step 1: Create `CommandPalette.tsx`**
Implement keyboard `⌘K` / `Ctrl+K` listener, modal popup with search input, list of routes, monitored diseases, and major sentinel cities.

- [ ] **Step 2: Update `menu.tsx` with semantic operational sections**
Categorize items into:
  - "Surveillance & Telemetry" (Dashboard, Intelligence, Risk maps)
  - "Incident Operations" (Alerts, Reports)
  - "Administration" (Uploads, Users)

- [ ] **Step 3: Refactor `Sidebar.tsx`**
Eliminate inline CSS styles. Implement smooth collapsed rail with tooltips, active left accent border, grouped section labels, and integrated bottom collapse toggle.

- [ ] **Step 4: Refactor `Layout.tsx`**
Add topbar breadcrumb trail, live sentinel status pill (`● 30 Sentinel Nodes Active`), command palette trigger button, refined profile popover, and clean drawer integration for the Guidelines panel.

- [ ] **Step 5: Verify build & typecheck**
Run: `npx --prefix src/frontend tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add src/frontend/src/components/ui/CommandPalette.tsx src/frontend/src/constants/layout/menu/menu.tsx src/frontend/src/layouts/
git commit -m "feat(layout): redesign app shell with semantic sidebar and command palette"
```

---

### Task 3: Dashboard Redesign (Surveillance Command Center)

**Files:**
- Modify: `src/frontend/src/features/dashboard/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `@/components/ui` (`Button`, `Card`, `Badge`, `Table`, `MetricCard`, `PageHeader`, `Skeleton`), `@/services/riskmaps/api`, `@/services/forecast/api`
- Produces: High-density surveillance command center page.

- [ ] **Step 1: Update `Dashboard.tsx` layout and components**
  - Implement `PageHeader` with title, subtitle, live telemetry badge, and quick action buttons.
  - Implement **Hero Outbreak Surge Strip**: highlighted banner with pulse badge, location, tabular surge probability percentage, and immediate drilldown link.
  - Implement 4-card `MetricCard` telemetry grid:
    1. Active Hotspots (High vs Watch breakdown)
    2. Peak Regional Surge Probability
    3. Sentinel Monitoring Stations
    4. SOP Field Action Triggers
  - Implement 4-card Disease Surge Matrix for Dengue, Leptospirosis, ILI, and Asthma with probability progress bars and risk pills.
  - Implement Ranked Sentinel Hotspots table with tabular cases, risk badges, and direct navigation links.
  - Remove all inline `style={{ ... }}` attributes.

- [ ] **Step 2: Verify typecheck and tests**
Run: `npx --prefix src/frontend tsc --noEmit` and `npm --prefix src/frontend test`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/frontend/src/features/dashboard/pages/Dashboard.tsx
git commit -m "feat(dashboard): redesign surveillance command center with high-density metrics"
```

---

### Task 4: Intelligence Matrix & Sentinel Location Detail Redesign

**Files:**
- Modify: `src/frontend/src/features/intelligence/pages/Intelligence.tsx`
- Modify: `src/frontend/src/features/intelligence/pages/LocationDetail.tsx`

**Interfaces:**
- Consumes: `@/components/ui` (`Button`, `Card`, `Badge`, `Table`, `Tabs`, `Input`, `Select`, `MetricCard`, `PageHeader`), `@/services/forecast/api/locations.api`, `@/services/surveillance/api`
- Produces: Unified intelligence filter console and sentinel location deep-dive.

- [ ] **Step 1: Redesign `Intelligence.tsx`**
  - `PageHeader` with active filter chips count.
  - Single-line responsive command filter bar: Search input, Province select, Municipality select, Disease pill buttons, Risk level pills, and Clear Filters button.
  - Tabbed switcher for "Sentinel Locations Matrix" vs "Data Feed Pipelines".
  - Locations Matrix: high-density cards with province tag, disease risk badge, case count, and direct link to location detail.
  - Pipelines tab: structured table displaying sync status, records ingested, and timestamps.
  - Remove all inline styles.

- [ ] **Step 2: Redesign `LocationDetail.tsx`**
  - Breadcrumb header with Back button, municipality title, overall outbreak risk badge, and "Broadcast Field Alert" modal button.
  - Environmental Telemetry Sensors rail: 3 `MetricCard` components for Cumulative Rainfall (mm), Mean Temperature (°C), and Air Quality Index (AQI).
  - Bi-LSTM Prediction Graph card with weekly timeline selector.
  - DOH/WHO Clinical SOP Playbook tabs (*Vector Control*, *Clinical Triage*, *Community Mobilization*) with step checklists and official citation footers.
  - Remove all inline styles.

- [ ] **Step 3: Verify typecheck and tests**
Run: `npx --prefix src/frontend tsc --noEmit` and `npm --prefix src/frontend test`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/frontend/src/features/intelligence/pages/
git commit -m "feat(intelligence): redesign sentinel matrix and location detail views"
```

---

### Task 5: Risk Maps Redesign (Geospatial Disease Risk HUD)

**Files:**
- Modify: `src/frontend/src/features/risk-maps/pages/RiskMaps.tsx`

**Interfaces:**
- Consumes: `@/components/ui` (`Button`, `Card`, `Badge`, `PageHeader`), `PHMap`, `@/services/riskmaps/api`
- Produces: Geospatial disease risk console with interactive map and side inspector.

- [ ] **Step 1: Redesign `RiskMaps.tsx`**
  - `PageHeader` with title and description.
  - Disease layer toggle pills with live count indicators and density overlay switch.
  - Split-view geospatial HUD:
    - 65% Interactive map canvas (`PHMap`) with clean border and full responsiveness.
    - 35% Persistent side inspector card: Selected hotspot details, severity badge, clinical recommendation checklist, and direct link to Location Detail.
  - Remove all inline styles.

- [ ] **Step 2: Verify typecheck and tests**
Run: `npx --prefix src/frontend tsc --noEmit` and `npm --prefix src/frontend test`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/frontend/src/features/risk-maps/pages/RiskMaps.tsx
git commit -m "feat(risk-maps): redesign geospatial command layout with persistent inspector"
```

---

### Task 6: Alerts Ledger & Epidemiological Reports Redesign

**Files:**
- Modify: `src/frontend/src/features/alerts/pages/Alerts.tsx`
- Modify: `src/frontend/src/features/reports/pages/Reports.tsx`

**Interfaces:**
- Consumes: `@/components/ui` (`Button`, `Card`, `Badge`, `Table`, `Dialog`, `Tabs`, `Input`, `Select`, `PageHeader`), `@/services/alerts/api`, `@/services/reports/api`
- Produces: Operational triage ledger and print-ready bulletin generator.

- [ ] **Step 1: Redesign `Alerts.tsx`**
  - `PageHeader` with summary counters (Total, Open Auto, Open Manual).
  - Triage toolbar with status tabs (`All`, `New`, `Acknowledged`, `Resolved`), kind filter, and "Broadcast Municipal Alert" primary button.
  - Broadcast modal dialog (`Dialog`) with municipality picker, SOP playbook code input, message textarea, and broadcast submit action.
  - High-density alert ledger items with colored severity left-borders, municipality tag, timestamp, and quick Acknowledge button.
  - Remove all inline styles.

- [ ] **Step 2: Redesign `Reports.tsx`**
  - `PageHeader` with report description.
  - Tabbed switcher for "Weekly PIDSR Bulletin" vs "Custom Linelist Export".
  - Weekly Bulletin tab: Monday date picker, "Print / Export PDF" button, and print-ready formatted layout (Key indicators, active hotspots, disease trends).
  - Custom Export tab: Filter card with Municipality, Disease, and Date range inputs, live row preview, and "Download CSV" button with spinner.
  - Remove all inline styles.

- [ ] **Step 3: Verify typecheck and tests**
Run: `npx --prefix src/frontend tsc --noEmit` and `npm --prefix src/frontend test`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/frontend/src/features/alerts/pages/Alerts.tsx src/frontend/src/features/reports/pages/Reports.tsx
git commit -m "feat(alerts-reports): redesign alert triage ledger and epidemiological reports"
```

---

### Task 7: Uploads, Users & Authentication Pages Redesign

**Files:**
- Modify: `src/frontend/src/features/uploads/pages/Uploads.tsx`
- Modify: `src/frontend/src/features/users/pages/Users.tsx`
- Modify: `src/frontend/src/features/auth/pages/Login.tsx`

**Interfaces:**
- Consumes: `@/components/ui` (`Button`, `Card`, `Badge`, `Table`, `Dialog`, `Input`, `Select`, `PageHeader`), `@/services/uploads/api`, `@/services/users/api`, `@/services/auth/api`
- Produces: Data ingestion console, administrative user directory, and login portal.

- [ ] **Step 1: Redesign `Uploads.tsx`**
  - `PageHeader` with "Download CSV Template" button.
  - Drag-and-drop file upload zone card with validation and file size notice.
  - Batch history data table with row counts, status badges, and "Inspect Issues" trigger.
  - Quarantined issues resolution modal dialog (`Dialog`) with individual accept/discard actions.
  - Collapsible municipal population update card.
  - Remove all inline styles.

- [ ] **Step 2: Redesign `Users.tsx`**
  - `PageHeader` with user counts (Total, Admins, Viewers) and "Add User" modal button.
  - User directory table with avatar/initials, username, role badge (`Admin` vs `Viewer`), active status toggle switch, and delete action.
  - Add User modal dialog (`Dialog`) with username input, role select, and submit button.
  - Remove all inline styles.

- [ ] **Step 3: Redesign `Login.tsx`**
  - Split-screen enterprise layout:
    - Left Hero: Deep slate panel with Health Alert branding, PIDSR telemetry badge, and feature list.
    - Right Auth: Centered card with clean typography, username & password inputs, sign-in button, error alert banner, and a prominent "Quick Demo Access" button.
  - Remove all inline styles.

- [ ] **Step 4: Verify typecheck and tests**
Run: `npx --prefix src/frontend tsc --noEmit` and `npm --prefix src/frontend test`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add src/frontend/src/features/uploads/pages/Uploads.tsx src/frontend/src/features/users/pages/Users.tsx src/frontend/src/features/auth/pages/Login.tsx
git commit -m "feat(admin-auth): redesign uploads ingestion, user directory, and login portal"
```

---

### Task 8: End-to-End Build Verification & Visual Polish

**Files:**
- All touched files

- [ ] **Step 1: Run complete Vitest suite**
Run: `npm --prefix src/frontend test`
Expected: All test suites PASS.

- [ ] **Step 2: Run complete TypeScript and Vite production build**
Run: `npm --prefix src/frontend run build`
Expected: Clean production bundle compiled with 0 errors.

- [ ] **Step 3: Final verification commit**
```bash
git commit --allow-empty -m "chore: verify end-to-end frontend build and layout redesign"
```
