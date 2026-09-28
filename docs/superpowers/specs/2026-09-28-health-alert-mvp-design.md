# Health Alert — Phased MVP Design (2026-09-28)

> Source: `HealthAlert_FullSystem_Data_Literature_Rev2.docx` (126 paras, 6 tables), `ARCHITECTURE_LOGIC.md` (CellWeGo Admin), `DESIGN.md` (Stripe-inspired), `frontend-design` skill.
> Decisions: phased MVP with ALL features, 4 diseases only (dengue, leptospirosis, ILI, asthma). SQL Server override (docx says MySQL). Approach A deterministic. Scaffold: `D:\SILLAG-Project-1\system\src`, DB `HealthAlert_MVP` on `localhost\SQLEXPRESS`.

## 1. Goal / Non-goals
- Goal: offline-first LGU/RHU overlay on EDCS-IS (RA 11332), no manual encoding, no PII (RA 10173). Targets: 2–4wk warning (respiratory/waterborne), up to 8wk vector, AUC 0.88–0.94, ≥90% sensitivity, <500ms retrieval, <60s delta-sync, 15–20h/wk saved.
- Non-goals (Phase 2+): remaining 12 diseases, real Bi-LSTM GPU training, live n8n at :5678, edge 8GB appliance, pharmacy/school/FHIR/trap/wastewater feeds.

## 2. Architecture
```
Browser (Vite dist) -> API (ASP.NET Core 10 + SignalR /hubs/notification) -> SQL Server
n8n JSON (src/automation) -> POST /api/surveillance/ingest/{feed} (cron-key) -> API
MVP: BackgroundService ticks instead of live n8n. Edge: outbox stub, SQLite replica Phase 2.
```
- Backend: `src/backend/{HealthAlert.Api,Common,Database,Tools,Tests}` net10.0, nullable+implicitUsings, single-file publish. Thin controllers -> Get/Edit tools -> EF context. Forecast behind `IForecaster`, RAG behind `IRagRetriever`.
- Frontend: React 19+Vite 7+TS, router@7 `createBrowserRouter`, axios `httpClient`, SignalR, shadcn/radix+Tailwind, lucide, `@/*->src/*` absolute only, PWA on. Slices: surveillance, forecasting, risk-maps, rag, playbooks, alerts, citizen, resources, reports, users, auth, dashboard, messaging, system. Pages own fetch; components dumb `*Table|*Toolbar|*Card|*Modal|*Dialog`; co-located `camelCase.ts` view-models; DTOs only in `services/*/types`; barrels only `services/*/api|types/index.ts`.
- Shell: `main.tsx` SW only; `App.tsx` Theme>Auth>SignalR>MessagingSignalR>Language>ErrorBoundary>Suspense>Router>Toaster. `/login,/unauthorized` public; `ProtectedRoute`+`PermissionRoute(surveillance:forecast:view, rag:answer:view, playbook:execute, admin:users:manage)`; single `Layout`.

## 3. Data (SQL Server)
- Tables (Tbl plural, `long` PK, nullable non-keys, encrypted getters for secrets): `tblDiseases` (4 seed rows), `tblFeeds` (10 rows per Table 1), `tblCases`, `tblForecastRuns` (+drivers JSON SHAP/LIME), `tblAlerts`, `tblPlaybooks`+`tblPlaybookExecutions`, `tblRagDocs` (doc/chapter/page), `tblUsers`+roles, `tblAuditTrail`, `tblOutbox` (idempotency key), views `vw*` for hotspots.
- Envelope: `ApiResponse<T>{success,code,message,data}`, `PaginatedResult<T>`. Paginated helper `page,search,sortKey,sortDir`. Every call `getSessionParams()`; 401 -> hard logout (keep chat+remember-me).
- Ingest idempotent by source key; `POST /api/surveillance/ingest/{feed}` cron-guarded. Routes: auth/login, surveillance/feeds, forecast/outlook+run, riskmaps/hotspots, rag/ask+reindex, playbooks+execute, alerts+ack, citizen/ask, reports/surveillance, hubs/notification.

## 4. Forecast (4 diseases, deterministic MVP)
- Dengue (Bi-LSTM stub): weighted lags + climate covariates, per-muni training stub, outbreak if > mean+1SD. Interface to swap real 4-layer/3-timestep net later.
- ILI (ARGO stub): `Yt=u+ΣamYt-m+ΣkgXt,g+ΣqjZt,j`, 2yr rolling vocab stub, Taglish (lagnat/ubo/hirap huminga) Granger stub.
- Lepto (DLNM table): `logE[Yt]=a+cb(Rain,lag)+cb(Temp,lag)+ns(week,3)+ns(year,2)`; RR vs zero rain 1.30/1.53/2.45/4.61/13.77, flood-adjusted.
- Asthma/HI rules: HI Rothfusz `HI=-42.379+2.049T+10.143R-...` -> PAGASA bands 27-32/33-41/42-51/≥52; asthma `logE[y|X]` AQI>100 RR1.42 (PM2.5>35.5, lag0 only).
- EARS+LASSO stub for social/news (news never triggers alone); SIWR reserved Phase 2. Rolling-origin validation vs naive/EDCS-delay on RMSE/MAE/AUC/sensitivity/peak error.
- # ponytail: in-memory forecaster, real Python sidecar if accuracy matters. # ponytail: BackgroundService tick, live n8n if ops needs it.

## 5. Frontend visual (DESIGN.md + frontend-design, non-generic)
- Tokens: primary `#533afd`, deep `#4434d4`, press `#2e2b8c`, ink `#0d253d/#273951`, mute `#64748d`, canvas `#ffffff/#f6f9fc`, cream `#f5e9d4`, hairline `#e3e8ee`, ruby `#ea2261`. Display: sohne-var fallback system-ui, 300wt, -1.4..-0.2px tracking, tabular numerics for counts. Pills tight-radius, near-white cards, `shadow-blue` elevation only, CSS gradient mesh upper-third (no lib).
- frontend-design: hero = most characteristic thing (risk map, not big-number+gradient default); 1–2 faces distinct; <80ch lines; structure encodes info (no 01/02/03 unless sequence); no single-word accent/ALLCAPS labels. Bilingual Taglish citizen triage, page citations.
- Realtime: `useRealtime('forecast.dengue.{muni}', refetch)` badges/banners; offline GET cache + queue drain on online/focus/5s.

## 6. Security / Testing / Deploy
- JWT short-lived + 24h session discipline; router+controller double permission check; cron-key + webhook verify; n8n key server-only; uploads type-check; aggregate centroids only.
- Tests: xUnit Get/Edit per domain + envelope/guard asserts + migration convention pin; frontend `tsc --noEmit`, view-model units, 1 E2E forecast->playbook->alert; n8n fixtures + duplicate/malformed replay.
- Deploy: central API+SQL+Redis+Vite+n8n behind TLS; edge single-file+SQLite Phase 2. Milestones: M1 pipelines+RAG DB, M2 appliances+training, M3 peak-season validation.

## 7. Phases
- MVP (this spec): all slices live, 4 diseases, deterministic math, seeded bulletins, stubs for n8n/edge.
- P2: +12 diseases, Python Bi-LSTM sidecar, live n8n 15 workflows, SQLite RAG artifact <500ms, edge appliance, Phase-2 feeds.
- Commercial: 5% LDRRMF tiers ₱150-180k muni / ₱450-600k city / ₱1.2-1.5M prov, ₱850k grant milestones.

## Self-review
- No TBDs; MySQL->SQL Server override explicit; 4-disease cut explicit; deterministic-vs-real boundary explicit via interfaces; no contradictions; single-plan scope.
