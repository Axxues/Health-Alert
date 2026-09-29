# Cellwego-Inspired Enterprise UI Redesign Specification

**Date:** 2026-09-29  
**Branch:** `feature/cellwego-enterprise-ui` (or active development branch)  
**Status:** Approved  
**Reference Codebase:** `D:\cellwego\Frontend\Admin`

---

## 1. Problem Statement & Executive Summary

The current HealthAlert system UI exhibits an overly vibrant, high-contrast palette with bright neon gradients (magenta, cyan, vibrant purple, intense green) and multi-colored card fills that distract from critical epidemiological data.

The user explicitly requested:
> *"The design on all of the pages of the system (make sure to include everything) looks too colorful and unprofessional, change that. Scan and analyze the design on 'D:\cellwego\Frontend\Admin' and copy it."*

This specification defines the complete end-to-end design transition from the colorful aesthetic to the refined, calm, executive B2B SaaS design system modeled directly on **`D:\cellwego\Frontend\Admin`** (Shadcn UI / Tailwind design standard).

---

## 2. Design System Architecture (Copied from Cellwego)

### 2.1 Color Tokens & Atmosphere

```css
:root {
  /* Core Background & Surfaces */
  --background: 220 14% 97.5%;        /* #f8fafc */
  --foreground: 222.2 84% 5%;          /* #020617 */
  --card: 0 0% 100%;                   /* #ffffff */
  --card-foreground: 222.2 84% 5%;
  --card-hover: 220 14% 95%;           /* #f1f5f9 */
  --surface: 0 0% 100%;

  /* Primary Brand - Crisp Slate Blue */
  --primary: 221 83% 55%;              /* #2563eb */
  --primary-foreground: 210 40% 98%;   /* #f8fafc */

  /* Secondary & Muted */
  --secondary: 210 40% 96.1%;          /* #f1f5f9 */
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%; /* #64748b */

  /* Semantic Statuses (10% Soft Pastel Tints) */
  --success: 142 71% 30%;              /* #15803d */
  --warning: 38 92% 50%;               /* #d97706 */
  --destructive: 0 84.2% 60.2%;        /* #dc2626 */
  --info: 199 89% 48%;                 /* #0284c7 */

  /* Borders & Dividers */
  --border: 214.3 31.8% 91.4%;         /* #e2e8f0 */
  --input: 214.3 31.8% 91.4%;
  --ring: 221 83% 55%;

  /* Radii */
  --radius: 0.75rem;                   /* 12px */
  --radius-sm: 0.375rem;               /* 6px */
  --radius-md: 0.5rem;                 /* 8px */
  --radius-lg: 0.75rem;                /* 12px */
  --radius-xl: 1rem;                   /* 16px */
  --radius-2xl: 1.5rem;                /* 24px */
}

.dark {
  /* Deep Slate Matte Dark Mode */
  --background: 220 29% 10%;           /* #111726 */
  --foreground: 210 40% 96%;           /* #f1f5f9 */
  --card: 220 29% 12%;                 /* #151d30 */
  --card-foreground: 210 40% 96%;
  --card-hover: 217 19% 18%;           /* #1e293b */
  --surface: 220 29% 14%;              /* #1b243b */

  --primary: 217 91% 60%;              /* #3b82f6 */
  --primary-foreground: 0 0% 100%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 96%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20% 65%;     /* #94a3b8 */

  --success: 142 70% 38%;              /* #22c55e */
  --warning: 38 92% 50%;               /* #f59e0b */
  --destructive: 0 62.8% 50%;          /* #ef4444 */
  --info: 199 89% 55%;                 /* #38bdf8 */

  --border: 217 19% 20%;               /* #252f42 */
  --input: 217 19% 20%;
  --ring: 217 91% 60%;
}
```

### 2.2 Typography & Text Treatment
- **Font Family**: `"Plus Jakarta Sans"`, system-ui, -apple-system, sans-serif.
- **Numbers**: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum", "zero"`.
- **Page Titles**: `font-size: 26px; font-weight: 800; letter-spacing: -0.025em; color: var(--foreground)`.
- **Sub-Captions**: `font-size: 13.5px; color: var(--muted-foreground); line-height: 1.5`.
- **Metric Labels**: `font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted-foreground)`.

### 2.3 Component Archetypes (from Cellwego)

1. **Dashboard Section Card (`DashboardSectionCard`)**:
   - Container: `bg-card rounded-2xl border border-border shadow-subtle overflow-hidden`.
   - Header: `px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between`.
   - Title: `text-base font-bold text-foreground tracking-tight`.
   - Body: `p-6`.

2. **KPI Metric Card (`DashboardSummaryCards` archetype)**:
   - Container: `bg-card rounded-2xl border border-border border-l-4 p-5 shadow-subtle hover:-translate-y-0.5 hover:shadow-card transition-all`.
   - Left-Border Accents:
     - Primary / Cases: `border-l-blue-500`
     - Success / Low Risk: `border-l-emerald-500`
     - Warning / Surge: `border-l-amber-500`
     - Destructive / Outbreak: `border-l-rose-500`
   - Content:
     - Top row: Uppercase tracking-wider label (`text-[11px] font-bold text-muted-foreground uppercase`).
     - Value: `text-2xl font-black text-foreground mt-2`.
     - Subtitle / Trend: `text-xs text-muted-foreground mt-1`.
     - Icon: `p-3 rounded-xl bg-primary/10 text-primary` (or `bg-success/10 text-success`).

3. **Status Badges & Chips (`badge.tsx` archetype)**:
   - `rounded-lg px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1.5`.
   - Normal/Routine: `bg-success/10 text-success`
   - Warning/Watch: `bg-warning/10 text-warning`
   - Alert/High Risk: `bg-destructive/10 text-destructive`
   - Info/Streams: `bg-info/10 text-info`
   - Muted/Inactive: `bg-muted text-muted-foreground`
   - No neon glows, no high-contrast dark pills.

4. **Data Tables (`table.tsx` archetype)**:
   - Wrapper: `rounded-xl border border-border overflow-hidden bg-card shadow-subtle`.
   - Header `thead`: `bg-muted/50 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground`.
   - Row `tbody tr`: `border-b border-border/60 hover:bg-muted/30 transition-colors`.
   - Cell `td`: `px-4 py-3 text-sm text-foreground align-middle`.

5. **Buttons (`button.tsx` archetype)**:
   - Primary: `bg-primary text-primary-foreground font-semibold rounded-xl px-4 py-2 text-sm shadow-subtle hover:bg-primary/90 transition-all`.
   - Secondary / Ghost: `bg-transparent hover:bg-muted text-foreground border border-border rounded-xl px-3.5 py-2 text-sm font-semibold`.

---

## 3. Layout Shell Overhaul (`Layout.tsx`)

### 3.1 Topbar / Navbar
- Fixed `h-16 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-subtle px-6 flex items-center justify-between`.
- Brand: Clean HealthAlert shield/icon, subtle logo text, small `v1.0` badge.
- Global Search: Minimalist input `bg-muted/50 border border-border/60 rounded-xl px-3.5 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary`, with `⌘K` badge.
- Right actions: Sentinel stream pulse (`live-dot`), theme toggle button, notification bell, user profile trigger.
- **Profile Modal**: Clean Shadcn dialog styling, user metadata, logout button (no outdated tags).

### 3.2 Sidebar
- Neutral slate background `w-64 border-r border-border/60 bg-background/95 flex flex-col`.
- Collapse toggle floating on right border matching Cellwego's `PanelLeftClose / PanelLeftOpen` button.
- Clean category grouping and icons with subtle inactive hover (`hover:bg-muted/60 text-muted-foreground hover:text-foreground`).
- Active link: `bg-primary/10 text-primary font-semibold rounded-xl` with left indicator dot or accent bar.

---

## 4. Page-by-Page Overhaul Scope

| Page | Current Colorful Elements to Remove | Replacement with Cellwego Design |
|---|---|---|
| **Dashboard** | Colorful radial gradients, neon hero gradient card (`#312e81` gradient), bright red/green pills | Cellwego `DashboardSectionCard` containers, `DashboardSummaryCards` with `border-l-4` color cues, subdued 10% tinted status badges, clean slate charts |
| **Forecast** | Colorful outline pills, neon probability meters | Clean search & filter bar, `border-l-4` location cards, gentle progress bars, executive directory layout |
| **Location Forecast Detail** | Neon glowing cards, intense red probability numbers | Clean breadcrumbs, `DashboardSectionCard` layout, dual-horizon SVG chart styled with calm enterprise blue & amber, clean covariates grid |
| **Surveillance** | Saturated stats, loud table colors | Clean telemetry cards with soft badges, clean PIDSR clinical intake table, pipeline status list |
| **Location Surveillance Detail** | High-saturation header banner | Clean slate header, soft watch badges, structured clinical log table |
| **Risk Maps** | Garish multi-color sidebar, loud filter pills | Cellwego slide-over panel with clean border, quiet severity legend, refined map controls |
| **Ask Library (RAG)** | Neon AI sparkles, high contrast message bubbles | Clean ChatGPT/Cellwego AI assistant layout, subdued chat bubbles, structured citation pills |
| **Playbooks** | Intense rainbow urgency tags | Refined SOP cards with `bg-warning/10` or `bg-destructive/10` badges, clean step checklists |
| **Alerts** | Loud flashing borders, chaotic badges | Professional incident management feed, clean triage controls, quiet timestamp metadata |
| **Medicine & Clinical** | Multi-colored pharmacy cards | Clean stock inventory table matching Cellwego warehouse inventory tables |
| **Citizen Telemetry** | Loud syndromic report tiles | Structured incident triage directory |
| **Reports** | Chaotic metric chips | Executive report generation form and download history table |
| **Users & Permissions** | Colored role pills | Clean RBAC user management table with status toggles |
| **System Settings** | Garish server health gauges | Clean diagnostics table with calm green/amber health indicators |
| **Login / Auth** | Neon background splashes | Clean centered enterprise login card with subtle border and brand mark |

---

## 5. Verification & Testing Criteria

1. **Compilation & Bundle**: `npm run build` passes with 0 TypeScript and bundling errors.
2. **Unit & Service Tests**: All Vitest test suites (`locations.api.test.ts`, `PredictionGraph.test.ts`, `auth.test.ts`, etc.) pass 100%.
3. **Visual Cohesion**: Every page conforms to Cellwego's calm, executive slate aesthetic in both Light Mode and Dark Mode. No neon glow or saturated multicolor gradients remain.
