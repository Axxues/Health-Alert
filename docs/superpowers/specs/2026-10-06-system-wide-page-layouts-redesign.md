# Health Alert / BantayHealthAI — System-Wide Page Layouts & Design Redesign

> Date: 2026-10-06  
> Scope: Entire Frontend System Layout, Navigation Shell, Component Foundation, and All Pages  
> Target Repository: `d:\SILLAG-Project-1\system` (Health Alert / BantayHealthAI)

---

## 1. Executive Summary & Aesthetic Vision

Health Alert (BantayHealthAI) is an epidemiological disease surveillance and outbreak early-warning system serving Local Government Units (LGUs), City/Municipal Health Offices, and the Department of Health (DOH).

This redesign transforms the entire frontend from scattered, ad-hoc inline styles and inconsistent layout wrappers into a unified, **High-Density Epidemiological Command Center** inspired by Linear and Datadog enterprise architectures:
* **Crisp Slate Surfaces & Hairline Borders:** Micro-contrast surfaces with clear visual hierarchy, eliminating messy inline styles.
* **Tabular Figures & High Information Density:** Numeric alignment for epidemiological telemetry, case velocity counts, Breteau indices, and model surge probabilities.
* **Semantic Outbreak Signaling:** Soft tinted status badges with live pulse indicators for critical outbreak risks without visual clutter.
* **Streamlined Shell & Keyboard Navigation:** Collapsible operational sidebar, breadcrumbs, status ticker, and an interactive **Command Palette (⌘K)** for instantaneous navigation to sentinel sites and diseases.

---

## 2. Design System Tokens & Foundation

### 2.1 CSS Variables & Color Tokens (`src/frontend/src/index.css`)
Refined HSL variables supporting light and dark modes:
* **Surfaces:**
  * Light: Canvas `#ffffff`, subtle panel `#f8fafc`, card hover `#f1f5f9`, border `#e2e8f0`, deep ink `#090d16`, muted ink `#64748b`.
  * Dark: Canvas `#0b0f17`, card surface `#111827` / `#161f30`, card hover `#1e293b`, hairline border `#1e293b`, text `#f8fafc`, muted text `#94a3b8`.
* **Outbreak Severity Accents:**
  * **Critical / High Outbreak Risk:** `#dc2626` (Red-600) / dark `#ef4444`, soft background `rgba(220, 38, 38, 0.1)`, pulsing status pip.
  * **Elevated Watch / Warning:** `#d97706` (Amber-600) / dark `#f59e0b`, soft background `rgba(217, 119, 6, 0.1)`.
  * **Routine / Baseline:** `#15803d` (Emerald-700) / dark `#10b981`, soft background `rgba(16, 185, 129, 0.1)`.
  * **Command Brand Accent:** Electric slate blue `#2563eb` (Blue-600) / dark `#3b82f6` for primary CTAs, active nav items, and focus rings.
* **Typography & Monospace:**
  * Font family: `Plus Jakarta Sans`, system fallback.
  * Tabular metrics: `font-variant-numeric: tabular-nums` for all telemetry counts, probabilities, and timestamps.

### 2.2 UI Primitives (`src/frontend/src/components/ui/`)
A modular UI primitive library to replace all inline styling across pages:
1. **`Button.tsx`**: Variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`; sizes: `sm`, `md`, `lg`, `icon`; built-in loading spinner support.
2. **`Card.tsx`**: Modular container: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
3. **`Badge.tsx`**: Standard status pills (`danger`, `warning`, `success`, `neutral`, `primary`, `outline`) with optional animated live pulse pip.
4. **`Table.tsx`**: High-density data table (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableEmpty`) with sticky header support and row hover effects.
5. **`Dialog.tsx`**: Accessible modal overlay with backdrop fade, Escape key close, focus containment, and header/footer slots.
6. **`Tabs.tsx`**: Pill and underline tab switcher with smooth active state indicator.
7. **`Input.tsx` & `Select.tsx`**: Standardized text, number, and search inputs with icon slots; styled native select dropdowns.
8. **`MetricCard.tsx`**: Telemetry tile with title, prominent value, subtitle, trend delta, and icon badge.
9. **`PageHeader.tsx`**: Unified page title header with breadcrumb trail, live status badge, and right-aligned action buttons.
10. **`Skeleton.tsx`**: Shimmer loaders for tables, metric cards, and charts during asynchronous telemetry loading.
11. **`CommandPalette.tsx`**: Global spotlight modal (`⌘K`) with fuzzy search across sentinel locations, diseases, and application pages.

---

## 3. Global App Shell & Navigation Layout

### 3.1 Topbar Navigation (`Layout.tsx`)
* **Brand & Breadcrumb Rail:** Left section displays the HealthAlert shield emblem, live operational badge (`Region I · PIDSR Live`), and dynamic breadcrumbs tracking current page and location routes.
* **Command Palette Button (⌘K):** Center-left search trigger pill displaying keyboard shortcut (`⌘K` / `Ctrl+K`) that opens the `CommandPalette` modal.
* **Status Ticker & Utilities:**
  * Live telemetry status pill (`● 30 Sentinel Nodes Active`).
  * Theme Toggle (Dark/Light switcher).
  * User profile button and dropdown with user details, role badge (`Admin` / `Surveillance Officer`), and sign-out action.

### 3.2 Enhanced Collapsible Sidebar (`Sidebar.tsx`)
* **Semantic Clusters:**
  1. *Surveillance & Intelligence:*
     * **Dashboard** (`/`) — Command Center
     * **Intelligence** (`/intelligence`) — Forecast & Sentinel Matrix
     * **Risk Maps** (`/risk-maps`) — Geospatial Hotspots
  2. *Incident Operations:*
     * **Alerts** (`/alerts`) — Triage & Broadcasts
     * **Reports** (`/reports`) — PIDSR Bulletins & Exports
  3. *System Administration:*
     * **Uploads** (`/uploads`) — PIDSR Linelist & Population Ingestion (Admin/Encoder)
     * **Users** (`/users`) — User Directory & Roles (Admin)
* **Collapse States:**
  * Expanded (240px): Section labels, icons, bold text, left active indicator rail.
  * Collapsed (64px): Icon-only with tooltip titles.
  * Seamless collapse toggle integrated into the bottom rail.

### 3.3 Guidelines Assistant Panel (`GuidelinesPanel.tsx`)
* Floating trigger button restyled into a clean, floating quick-action button.
* Slide-over inspector panel (400px) with medical citation chips, chat dialogue, and SOP references.

---

## 4. Page Layouts & Arrangements

### 4.1 Dashboard (`Dashboard.tsx`)
* **Hero Surge Strip:** Prominent banner showing the highest surge probability location, disease name, risk badge, tabular probability percentage, and one-click drilldown link.
* **4-Column Telemetry KPI Grid:**
  1. *Active Outbreak Hotspots:* Total count with high-risk vs watch breakdown.
  2. *Regional Surge Probability:* Highest modeled probability.
  3. *Sentinel Node Coverage:* Total active monitored health stations.
  4. *Clinical SOP Triggers:* Open field response actions.
* **Disease Surge Matrix:** 4-card grid for Dengue, Leptospirosis, ILI, and Asthma showing probability meters, risk classification, and weekly delta.
* **Ranked Sentinel Targets Table:** High-density data table displaying municipality, disease, risk badge, case volume, and direct action link.

### 4.2 Intelligence Matrix (`Intelligence.tsx`)
* **Unified Filter Command Bar:** Single responsive toolbar with search input, Province selector, Municipality selector, Disease filter pills, and Risk level filter pills with reset button.
* **Dual Tabbed Views:**
  * **Sentinel Locations Grid:** High-density cards showing municipality name, province, active disease risk badges, case numbers, and chevron drilldown to `/intelligence/:locationId`.
  * **Data Feed Pipelines:** Clean monitoring table showing DOH PIDSR, Open-Meteo, Air Quality, and Wikimedia feed synchronization health and timestamps.

### 4.3 Sentinel Location Detail (`LocationDetail.tsx`)
* **Header & Quick Actions:** Breadcrumbs with back link, sentinel title, overall risk badge, and a primary "Broadcast Field Alert" modal trigger button.
* **Environmental Sensor Rail:** 3 telemetry cards for Cumulative Rainfall (mm), Mean Temperature (°C), and Air Quality Index (AQI) with live and lagged readings.
* **Bi-LSTM Forecast Visualization Card:** Embedded interactive chart displaying historical cases vs model forecast trajectory with confidence intervals.
* **Tabbed Clinical & Vector SOP Playbooks:** Structured tabs for *Vector Control*, *Clinical Triage*, and *Community Mobilization* with step-by-step checklists, target radius indicators, and official DOH/WHO citation footers.

### 4.4 Risk Maps (`RiskMaps.tsx`)
* **Geospatial Command Layout:**
  * Top bar: Disease layer toggle pills with live count badges (All, Dengue, Leptospirosis, ILI, Asthma) and layer controls.
  * Split-screen canvas: 65% full-height interactive Philippine map (Leaflet) with risk radius markers; 35% persistent side inspector card displaying detailed telemetry of the selected hotspot, field visit checklist, and navigation to the location detail page.

### 4.5 Alerts Ledger (`Alerts.tsx`)
* **Header & Triage Metrics:** Summary pill counters displaying total alerts, open automated model surge warnings, and open manual municipal broadcasts.
* **Triage Filter Bar:** Status tabs (`All`, `New`, `Acknowledged`, `Resolved`) with count badges, and kind filter (`All`, `Automated Model`, `Manual Broadcast`).
* **Broadcast Modal:** Clean dialog for broadcasting LGU emergency alerts with municipality picker, playbook reference code, and message textarea.
* **High-Density Alert Cards:** Cards styled with colored left border based on severity (Red for High/Surge, Amber for Warning, Blue for Broadcast), municipality tag, relative timestamp, alert content, and direct "Acknowledge" button.

### 4.6 Epidemiological Reports (`Reports.tsx`)
* **Tabbed Workspace:**
  * **Weekly PIDSR Bulletin Tab:** Week selector (Monday anchor) with a quick "Print / Export PDF" button. Print-ready bulletin layout with regional header, executive outbreak summary, disease incidence table, and active hotspot breakdown.
  * **Custom Linelist Export Tab:** Filter card with Municipality dropdown, Disease dropdown, and Date Range pickers. Live export summary card with "Download CSV" button showing spinner state during generation.

### 4.7 PIDSR Uploads & Linelist Ingestion (`Uploads.tsx`)
* **Header & Template Action:** Clean title with a "Download CSV Template" button.
* **Modern Upload Dropzone:** Drag-and-drop dashed file upload card with clear file type requirements, drag-over highlights, and progress indicator.
* **Batch Submissions Table:** Structured data table showing Batch ID, File Name, Uploaded Date, Record Count, Status badge, and an "Inspect Issues" trigger.
* **Quarantined Issues Modal:** Dedicated resolution dialog displaying quarantined rows with error reasons and individual "Accept Override" / "Discard" actions.
* **Population Data Card:** Secondary collapsible card for updating municipal census baselines.

### 4.8 User Directory (`Users.tsx`)
* **Admin Header:** User count breakdown (Total Users, Admins, Viewers) and an **"Add New User"** modal trigger.
* **Directory Table:** User avatar/initials, Username, Role badge (Admin vs Viewer), Status switch (Active / Deactivated), and inline actions.
* **Add User Modal:** Clean modal form with username input, role selection, validation feedback, and keyboard Enter submit.

### 4.9 Authentication Screen (`Login.tsx`)
* **Split Enterprise Layout:**
  * *Left Hero Panel:* Deep slate background with subtle mesh gradient, Health Alert logo, PIDSR surveillance badge, and bullet points of system capabilities.
  * *Right Auth Panel:* Centered card with clean typography, Username & Password inputs with focus rings, sign-in button with loading state, error alert banner, and a prominent **"Quick Demo Login"** button for instant one-click login.

---

## 5. Verification & Testing Plan

1. **Compilation & Type Safety:** Run `npx tsc --noEmit` to verify all TypeScript interfaces, component props, and imports.
2. **Unit & Regression Testing:** Run `npm run test` (Vitest) to ensure all existing test suites (prediction graph, rag, guidelines panel) remain green.
3. **Production Build:** Run `npm run build` (Vite production bundle) to ensure clean tree-shaking and zero asset compilation errors.
4. **Browser & Visual Polish:** Verify key screens (Login, Dashboard, Intelligence, Risk Maps, Alerts, Reports, Uploads, Users) for responsive behavior, clean alignment, and dark/light mode consistency.
