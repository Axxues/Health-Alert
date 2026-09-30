# Live Data Ingestion Design (2026-09-30)

Replace static fixture pipelines with legitimate live sources, phased by feasibility.
Supersedes the MVP posture of `2026-09-28-health-alert-mvp-design.md` §n8n-stubs for the feeds below; fixtures remain only where no legitimate path exists, tagged honestly.

## Decisions (approved)

1. **Phased by feasibility** — wire what has a legitimate endpoint now; model the rest openly.
2. **PIDSR via HDX pull** — `disease_pidsr_totals.csv` (city-weekly, DUA-governed), no manual encoder screen.
3. **Approach A (n8n-first)** — keep cron → fetch → normalize → POST `/ingest/{feed}`; swap fixture nodes for real HTTP fetches. No new services.

## Feed mapping

| Feed | Upstream (legit) | Cadence | Notes |
|---|---|---|---|
| weather | Open-Meteo (verified live, keyless); PAGASA TenDay first if `PAGASA_API_TOKEN` present, fallback Open-Meteo (PAGASA returns 498 without token) | hourly | San Fernando coords probed 2026-09-30 |
| aqi | Open-Meteo air-quality (CAMS PM2.5, keyless) | hourly | Labeled satellite-modeled, never as EMB station data |
| news | GDELT DOC API, once-daily, cache + backoff (rate-limited on probe) | daily | Keyword-filtered to 4 diseases, PH |
| pidsr | HDX `disease_pidsr_totals.csv` mapped to facilities/municipalities (city totals split by each facility's historical share, flagged modeled below city level) | weekly | City-weekly resolution, release lag; barangay splits stay modeled pending facility access |
| covid | WHO dashboard CSV extracts via HDX (national context); Region 1 covid rides PIDSR/ILI | weekly | DOH tracker and Data Drops dead since 2022 |
| heatmap | **Deleted as ingest** — computed backend-side from `tblCases` coordinates into a spread signal (cases within 5 km default, tunable, plus grid density) consumed by the surge model and displayed on the Risk Map | weekly (with forecast run) | Precision starts city-level, sharpens with facility data |
| trends | No official API; scraping is ToS-gray — stays modeled, tagged | — | |
| itis | DOH internal system, no public API — stays modeled, tagged | — | |
| esu | Internal LGU verification by definition; no external source can exist | — | ESU encoder screen is Phase 2 |
| social | No viable third-party path — replaced by first-party citizen/BHW intake, Phase 2 (`CitizenGetTools` is a stub) | — | |

## Provenance contract

- Every ingest payload carries `source` (`open-meteo` | `pagasa` | `gdelt` | `hdx-pidsr` | `who-hdx` | `modeled`) and `fetchedAt` (upstream read time).
- Backend validates `source` against a per-feed allowlist; stores it in new nullable `tblCases.Source` (migration precedent: `ForecastRunMuni`); `ReportedAt` remains arrival time.
- UI renders the source tag wherever counts appear — real vs synthetic is visible, never silently mixed.

## Credentials & schedules

- `dev-cron-key` leaves all 15 workflow JSONs → n8n env/credentials (`$env.CRON_KEY`).
- `PAGASA_API_TOKEN` optional credential; absent = Open-Meteo path.
- Cadences unchanged (ticker doc): weather/aqi hourly, news daily, pidsr/covid weekly.
- GDELT guarded by existing `sourceKey` idempotency — 429s can't duplicate.

## Failure handling

- Unchanged: `failure-handler` workflow + `ingest.dead-letter` audit + outbox.
- New: freshness rule — no successful ingest within 2× cadence fires alert fanout.

## Verification (all executable)

1. n8n execution history all-success per live feed.
2. `tblCases` counts move with `Source` values matching the mapping table.
3. Dashboard/Risk Map show new observed weeks.

## Explicitly out (Phase 2)

Citizen intake implementation, ESU encoder screen, PAGASA token acquisition, real model upgrade, facility/EDCS-IS access.
