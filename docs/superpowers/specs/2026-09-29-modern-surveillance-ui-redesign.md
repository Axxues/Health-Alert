# Health Alert — Modern Surveillance Frontend Redesign Specification (2026-09-29)

> **Goal**: Modernize and redesign all pages of the Health Alert platform (Dashboard, Forecast, Surveillance, Risk Maps, Ask Library, Playbooks, Alerts, Citizen, Medicine & Supplies, Reports, Users, System) with an Electric Indigo & Deep Navy surveillance aesthetic, Lucide React icons, and Plus Jakarta Sans typography.

---

## 1. Design System & Global Styles

### 1.1 Palette & Tokens
- **Brand Colors**:
  - `--primary`: `#533afd` (Electric Indigo)
  - `--primary-hover`: `#4434d4`
  - `--primary-light`: `rgba(83, 58, 253, 0.08)`
  - `--primary-glow`: `rgba(83, 58, 253, 0.25)`
- **Canvas & Surface Polarity**:
  - **Light Mode**:
    - `--canvas`: `#f8fafc`
    - `--backdrop`: `#f1f5f9`
    - `--card`: `#ffffff`
    - `--card-glass`: `rgba(255, 255, 255, 0.85)`
    - `--ink`: `#0d253d`
    - `--mute`: `#64748d`
    - `--hairline`: `#e2e8f0`
  - **Dark Mode**:
    - `--canvas`: `#0a0f1d`
    - `--backdrop`: `#060913`
    - `--card`: `#111827`
    - `--card-glass`: `rgba(17, 24, 39, 0.85)`
    - `--ink`: `#f1f5f9`
    - `--mute`: `#94a3b8`
    - `--hairline`: `#1e293b`
- **Surveillance Semantic Status**:
  - **Critical / Outbreak**: Coral Red `#ef4444` / Background `rgba(239, 68, 68, 0.12)`
  - **High / Warning**: Amber `#f59e0b` / Background `rgba(245, 158, 11, 0.12)`
  - **Elevated / Watch**: Violet Indigo `#6366f1` / Background `rgba(99, 102, 241, 0.12)`
  - **Normal / Safe**: Emerald `#10b981` / Background `rgba(16, 185, 129, 0.12)`
  - **Sync / Telemetry**: Cyan `#06b6d4` / Background `rgba(6, 182, 212, 0.12)`
- **Atmospheric Effects**:
  - Upper-third atmospheric mesh gradient on background.
  - Frosted glass headers and cards (`backdrop-filter: blur(16px)`).
  - Modern elevations (`0 4px 20px -2px rgba(0, 0, 0, 0.06)`).

### 1.2 Typography & Iconography
- **Font**: Google Font `Plus Jakarta Sans` imported via `index.html` (400, 500, 600, 700, 800).
- **Tabular Figures**: `font-feature-settings: "tnum", "zero"` for numbers, telemetry values, timestamps, and data tables.
- **Icons**: `lucide-react` replacing all unicode characters and rough SVG shapes.

---

## 2. Shell & Navigation

### 2.1 TopBar (`Layout.tsx`)
- Height: 60px with frosted glass blur.
- Health Alert Logo + Brand title with active telemetry indicator (`● LIVE SYNC`).
- Global search bar with Lucide `Search` and keyboard shortcut badge (`⌘K`).
- Theme switcher (`Sun` / `Moon` with smooth rotation), Notification bell with pulsing alert badge, and User Profile menu (Municipal Health Officer pill with dropdown).

### 2.2 Sidebar Navigation (`Sidebar.tsx`)
- Categorized into 3 functional groups:
  1. **EPIDEMIOLOGY & SURVEILLANCE**:
     - Dashboard (`LayoutDashboard`)
     - Forecast (`TrendingUp`)
     - Surveillance (`Radio`)
     - Risk Maps (`MapPin`)
  2. **OUTBREAK RESPONSE & LOGISTICS**:
     - Ask the Library (`BookOpenCheck`)
     - Playbooks (`Workflow`)
     - Alerts (`BellRing`)
     - Citizen (`UsersRound`)
     - Medicine & Supplies (`Pill`)
  3. **ADMINISTRATION & GOVERNANCE**:
     - Reports (`FileBarChart`)
     - Messaging (`MessageSquare`)
     - Users (`UserCheck`)
     - System (`Cpu`)
- Active nav item styling with electric indigo indicator pill and glowing background accent.

---

## 3. Core Feature Pages & Views

### 3.1 Dashboard (`Dashboard.tsx`)
- **Hero Header**: Epidemiological Surveillance Command Center title, live timestamp, and direct actions (`+ Run Forecast`, `Review Alerts`).
- **KPI Metrics**: Active Hotspots, High-Risk Barangays, Monitored Population, and Model Sensitivity.
- **Hotspot Severity Meters**: Visual ranking of municipalities with color-graded risk bars.
- **Top Threat Callout**: Deep navy card highlighting the leading outbreak threat with driving factors and one-click playbook trigger.
- **Live Alert Feed**: Triage alerts with severity badges and instant acknowledgment.

### 3.2 Forecast (`Forecast.tsx`)
- **Disease Tabs**: Dengue, Leptospirosis, ILI, Asthma.
- **Outlook Intelligence Card**:
  - Probability gauge with risk band chip (Critical Surge / Moderate / Low).
  - Outbreak driver chips: Rainfall mm, temperature, flood risk, symptom search spikes.
  - 2-week and 4-week forecast trajectory comparison vs epidemic threshold.
- **Model Simulation & Playbook Execution**: Quick actions to simulate and trigger protocol.

### 3.3 Surveillance (`Surveillance.tsx`)
- **Data Ingestion Health**: Overview cards for Ingested Records (24h), Active Data Feeds (10 Sources), Latency, and Anomaly Flags.
- **Feeds Table**: Feed Source, Type, Ingest Cadence, Last Sync, Status badge (`Active ●`, `Delayed ▲`), and Records Processed.

### 3.4 Risk Maps (`RiskMaps.tsx`)
- **Interactive Map**: Disease layer filters, hotspot markers colored by severity with pulsating rings.
- **Hotspot Details Drawer**: Barangay name, coordinates, case count, predicted 14-day trend, environmental risk factors, and direct forecast / playbook triggers.

### 3.5 Ask the Library / RAG Assistant (`Rag.tsx`)
- Conversational research assistant for clinical guidelines and DOH epidemiology SOPs.
- Quick suggested prompts (DOH Dengue protocol, Doxycycline post-flood dosing).
- Markdown response bubbles with citation cards showing document title, page numbers, and relevance.

### 3.6 Playbooks (`Playbooks.tsx`)
- Disease outbreak SOP cards (Dengue 4S, Leptospirosis Chemoprophylaxis, Asthma Surge).
- Task checklists with progress bars and one-click execution action with modal confirmation.

### 3.7 Alerts (`Alerts.tsx`)
- Triage stream filtered by severity (Critical, Warning, Watch, Resolved).
- Action buttons: Acknowledge alert, trigger community SMS broadcast.

### 3.8 Citizen (`Citizen.tsx`)
- Bilingual (English / Taglish) public symptom triage wizard.
- Triage urgency outcomes (Emergency, RHU Clinic Visit, Home Isolation).
- Community health advisory cards and SMS broadcast simulator.

### 3.9 Medicine & Supplies (New Feature: `Medicine.tsx`)
- Stockpile inventory for outbreak-critical medications: Oral Rehydration Salts (ORS), Doxycycline 100mg, IV Fluids (D5LR/Normal Saline), Dengue NS1 Rapid Antigen Tests, Salbutamol Inhalers, Paracetamol.
- Stock health meters and burn-down alert based on forecast demand.
- Batch expiry tracker and restock requisition dialog.

### 3.10 Reports (`Reports.tsx`)
- Weekly Epidemiological Surveillance Report (WESR) generator.
- Morbidity / mortality summary table by barangay.
- PDF bulletin generation and CSV data export.

### 3.11 Users (`Users.tsx`)
- Role-based user directory: Municipal Health Officer, Field Epidemiologist, BHW Lead, Admin.
- User status badges, role permission inspector, and Add Officer modal.

### 3.12 System (`System.tsx`)
- Health monitors for EDCS-IS sync, SignalR WebSocket connection, Ingestion Cron, and Database latency.
- Immutable audit log table recording user and automated actions.

---

## 4. Verification & Testing Plan
- `npm run build` (`tsc --noEmit && vite build`) passes with zero TypeScript or build errors.
- Visual validation: all 12 routes load smoothly, theme toggle switches between dark and light modes cleanly, and all components display without broken layouts.
