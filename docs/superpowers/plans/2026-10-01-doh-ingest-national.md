# DOH Ingest + National Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace demo data with automatic pulls from public DOH sources, go national across all PIDSR places, and show honest errors instead of mock fallback.

**Architecture:** `DohIngestTools` with two providers (HDX CKAN backfill + WDSR page scraper) writing case rows through the existing `SurveillanceEditTools.IngestAsync` path with distinct source codes; place directory derived from ingested data (regions/provinces from HDX rows, municipalities harvested from case SourceKeys) plus the existing static seeds; frontend list paths throw on failure so pages render error states.

**Tech Stack:** .NET 10, EF Core, xUnit, HDX CKAN API (keyless), doh.gov.ph WDSR listing (HTML only — no PDF parsing in this slice), React + Tailwind.

**Spec:** user directive 2026-10-01 (automatic DOH ingest, national PIDSR scope, no mock fallback) + `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §2 (feed interface, source-tagging, staged sources).

## Global Constraints

- Every ingested row source-tagged (`hdx-doh-epi`, `doh-wdsr`, `pidsr-demo` legacy); sources never mix silently.
- No live facility-level rows exist publicly — HDX covers dengue history; recent weeks for all 4 diseases come best-effort from WDSR HTML; gaps are reported, never filled with invented numbers.
- Demo seeder stays dev-only and empty-DB-only; it loses to any real rows.
- Backend builds/tests run `-c Release`; frontend `npx tsc --noEmit -p tsconfig.json`.
- TDD: failing test first for every task; commit per task.

---

### Task 1: HDX DOH-Epi dengue backfill ingestor

**Files:**
- Create: `src/backend/HealthAlert.Tools/DohIngestTools.cs`
- Test: `src/backend/HealthAlert.Tests/DohIngestTest.cs`

**Interfaces:**
- Consumes: `SurveillanceEditTools.IngestAsync` (read its signature first), HDX CKAN API.
- Produces: `static List<(string Province, string Region, DateTime Week, double Cases)> ParseHdxCsv(string csv)` handling the HXL-tagged second row (skip it) and `loc,cases,deaths,date,Region` columns; `Task<int> BackfillHdxAsync(HealthAlertDbContext ctx, HttpClient http, CancellationToken ct)` returning rows written; SourceKey format `"Province|HDX-yyyy-Wnn"`, feed/source `hdx-doh-epi`, idempotent re-runs (same keys → no new rows).

- [ ] **Step 1: Write the failing tests.** Fixture CSV inline (header + HXL row + 3 data rows across 2 provinces). Assert parse output rows/values; assert backfill with a fake HttpClient writes rows then zero on re-run. Resolve the exact HDX package/resource URL at implementation time via `https://data.humdata.org/api/3/action/package_search?q=dengue%20philippines` (keyless) — hard-code the discovered `package_show` + resource download URL as constants with a comment.
- [ ] **Step 2: Run to verify fail.** `dotnet test src/backend/HealthAlert.Tests -c Release --filter "DohIngestTest"`
- [ ] **Step 3: Implement.** CSV split-lines parser (no new packages); date column → Monday of that ISO week for ReportedAt.
- [ ] **Step 4: Run full suite green.** `dotnet test src/backend/HealthAlert.Tests -c Release`
- [ ] **Step 5: Commit** `git add src/backend/HealthAlert.Tools/DohIngestTools.cs src/backend/HealthAlert.Tests/DohIngestTest.cs` + `git commit -m "feat: HDX DOH-Epi dengue backfill ingestor"`.

### Task 2: WDSR listing scraper (best-effort, HTML only)

**Files:**
- Modify: `src/backend/HealthAlert.Tools/DohIngestTools.cs` (add `Task<List<WdsrFinding>> ScrapeWdsrAsync(HttpClient, ct)`)
- Test: extend `src/backend/HealthAlert.Tests/DohIngestTest.cs` (fixture HTML test)

**Interfaces:**
- Produces: `record WdsrFinding(string Title, string Url, DateTime? SeenAt)`; scraper fetches `https://doh.gov.ph/health-statistics/weekly-disease-surveillance-report`, extracts anchor hrefs containing `surveillance`/`wdsr`/`weekly`, resolves relative URLs. Additionally parses any HTML `<table>` on the page whose headers mention a tracked disease + region/province into case rows via the ingest path (same SourceKey convention, source `doh-wdsr`); unparseable content is skipped with a logged warning, never an exception out of the ticker.

- [ ] **Step 1: Failing test** on a saved HTML fixture string (2 links, 1 mini table) asserting findings + parsed rows.
- [ ] **Step 2-4:** Red, implement (regex/DOM via string parsing only — no new packages; `System.Xml.Linq` is acceptable for well-formed fragments, else regex), green full suite.
- [ ] **Step 5: Commit** `git commit -m "feat: best-effort WDSR listing scraper"`.

### Task 3: National place directory + ticker wiring

**Files:**
- Modify: `src/backend/HealthAlert.Tools/RiskMapsGetTools.cs` (places = static seeds UNION distinct munis from cases UNION distinct HDX provinces; regions/provinces surfaced on rows when known)
- Modify: `src/backend/HealthAlert.Api/Services/IngestTickerService.cs` (weekly gate: HDX backfill once when empty + WDSR scrape; same scoped try/catch pattern)
- Test: extend `DemoHistoryTest.cs` or new `NationalScopeTest.cs` — seed HDX-style rows for a non-Region-I province (e.g. Cebu) and assert it appears in `LocationsAsync`/`Hotspots()`.

- [ ] **Steps:** red (Cebu absent), green (present with live counts), full suite, commit `git commit -m "feat: national place directory from ingested data"`.

### Task 4: Remove mock fallback, honest error states

**Files:**
- Modify: `src/frontend/src/services/forecast/api/locations.api.ts` (throw on network error or empty array; delete mock entries + client filter), `src/frontend/src/services/riskmaps/api/riskmaps.api.ts` (same; delete `PHILIPPINES_NATIONWIDE_HOTSPOTS` + alias), `src/features/intelligence/pages/Intelligence.tsx` + RiskMaps page (error panel already exists — verify it renders the thrown message; add retry button if missing).
- Test: rewrite service tests to assert throw (not fallback).

- [ ] **Steps:** red, green (`npx vitest run src/services/forecast src/services/riskmaps` + `npx tsc --noEmit -p tsconfig.json`), commit `git commit -m "feat: drop mock fallback, surface feed errors"`.

**Explicitly out of scope:** PDF parsing, detail-timeline wiring (`getLocationDetail` stays mock — next slice), per-municipality national coverage beyond harvested data, live EDCS access (needs the DOH-RO I agreement from the proposal).
