# BantayHealthAI Realignment — Design

> Basis: `BantayHealthAI_FullBlown-Proposal_v2.docx` (DMMMSU-SLUC, DOH-RO I, Region I, Jan 2028–Dec 2029).
> Deliberate deviations, all user-approved: disease scope stays dengue/leptospirosis/ILI/asthma
> (proposal mandates dengue/measles/ILI — measles slots in later via the disease-extensible registry);
> no upload UI (ingestion is automatic); Google Trends replaced by Wikimedia pageviews (see §2).

## 1. Build order (approved: vertical slices in dependency order)

1. Covariate feeds → 2. Model registry + fitted regressors → 3. Threshold bands + dynamic hotspots →
   4. Alerts page → 5. Reports UI → 6. Users management. Each slice shippable independently.

## 2. Covariate feeds and data flow

- New `Tools/CovariateTools` + `tblCovariateReadings` (place, date, source, payload JSON).
- Existing CronJob controller pulls daily per monitored municipality:
  - Open-Meteo forecast API — rainfall, temperature, humidity (free, keyless, 10k calls/day covers ~30 municipalities).
  - Open-Meteo air-quality API (CAMS) — PM2.5, PM10, AQI.
  - Wikimedia Analytics API — weekly pageviews for Dengue fever / Leptospirosis / Influenza / Asthma
    articles as the search-interest proxy (Google scraping rejected: ToS violation, fragile).
  - Open-Meteo archive API (ERA5) — one-time 2-year backfill of rainfall/temperature/AQI per municipality
    as training history.
- All consumers (models, hotspot scoring, detail pages) read the table, never the APIs directly.
- Failure policy: last good reading stands, failure logged, pages display the reading date.
- Migrations ship seeded fallback rows so the system runs offline on first boot.

## 3. Models, risk bands, dynamic hotspots

- New `tblForecastModels` (disease, version, coefficients JSON, trained-on range, metrics JSON, status).
- Per disease, ridge-penalized linear regressor over lagged weekly cases + covariate lags
  (rainfall 2–6 week lags for dengue/leptospirosis, AQI/heat lags for asthma, pageview momentum for all),
  fitted in C# — no Python toolchain. Walk-forward validation; RMSE/MAE/R² stored with coefficients.
- Retraining is an explicit admin action staging a challenger version; challengers never silently replace
  deployed models (proposal requirement). Existing heuristic estimators remain as cold-start fallbacks.
- Risk bands from per-disease threshold documents (e.g. Breteau ≥ 20, probability ≥ 0.7 → High;
  0.4–0.7 → Watch; else Routine), stored as data so epidemiologists tune them without code changes.
  Band = max severity across probability, case-velocity, and covariate-threshold signals.
- Dynamic hotspots: hard-coded registry deleted; level/cases/probability computed from `tblCases` +
  model outputs + covariate thresholds at request time, cached 1 hour. API shape unchanged, so Risk Maps
  and Dashboard keep working.

## 4. Pages and roles

- **Alerts page:** unified ledger of auto-generated alerts (written on entry to High, auto-resolved on
  downgrade, deduplicated per sustained outbreak) and manual broadcasts (audience by municipality/facility,
  message, linked SOP, via outbox). Acknowledge/resolve actions; broadcast is admin-only.
- **Reports UI:** weekly PIDSR-style bulletin generator (cases, trends, hotspots, forecasts, active alerts)
  with print/export, plus custom tab (place, disease, date range → CSV of cases, forecasts, alerts).
  Existing Reports backend gets real queries instead of hard-coded samples.
- **Users management:** exactly two roles — Admin (users, models/retrain, thresholds, broadcasts, config)
  and Viewer (read dashboards, forecasts, guidelines). Existing permission gates stay; Users page is
  admin-only (create, deactivate, role assign).

## 5. Testing

- Backend xUnit per slice: feed parsing/cache fallback, regressor fit + walk-forward metrics on fixtures,
  band assignment at threshold edges, alert dedup lifecycle, report query correctness, role gating.
- Frontend: keep existing vitest suites green; add tests for band display and ledger actions.
- Verification before completion: `dotnet test`, `npx tsc --noEmit`, vitest run.

## 6. Out of scope (explicit)

Data-upload UI, Google scraping, measles models, model auto-retraining, per-feature permission matrix,
live PAGASA integration (Open-Meteo covers weather/AQI; PAGASA plugs into the feed interface later).
