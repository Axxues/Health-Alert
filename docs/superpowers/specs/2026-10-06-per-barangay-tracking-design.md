# Per-Barangay Tracking — Design Spec (2026-10-06)

## Problem
The system tracks one station per municipality. SourceKeys, groupings, and
row IDs all key on municipality, so additional barangays inside the same
town collapse into (or duplicate) existing rows. Goal: ~50 barangay
stations across more Region 1 towns, each independently tracked.

## Section 1 — Key format (approved)
New keys: `{muni}|{barangay}|{facility}|{year}-W{ww}|{disease}` (5-part).
Back-compat:
- 4-part legacy (`{muni}|{facility}|{year}-W{ww}|{disease}`): muni = segment 0,
  barangay = "" → directory fallback.
- 2-part HDX/WDSR province keys: unchanged behavior.
- Dedupe stays full-string exact match (`seen` set in `UploadTools`).

## Section 2 — Grouping, IDs, resolver (approved)
- `LocationsAsync`, `Hotspots`, `SeriesAsync`: group by
  (municipality, barangay, disease); barangay parsed from 5-part keys,
  "" otherwise.
- `Series` endpoint gains optional `brgy` query param; filters segment 1
  on 5-part keys.
- Row IDs become `{muni}|{brgy}|{disease}` slugified; empty barangay keeps
  the legacy `{muni}|{disease}` shape so existing links keep resolving.
- `getLocationDetail` matches entries on (municipality, barangay, disease).
- Frontend: no changes required (titles, search, merged-node inspector
  already key on muni+barangay).

## Section 3 — Upload, seed, testing (approved)
- `UploadTools.IngestAsync` writes the `barangay` CSV column into the key
  (5-part). Validation of the column: required-nonempty falls back to ""
  (never quarantine on barangay alone).
- Seed ~50 barangay stations: more Region 1 towns + 2–4 barangays in
  existing towns, via CSV upload through `/api/surveillance/upload`
  (no API restart). Names/coords beyond the current directory are
  best-known approximations, correctable later through the Uploads page.
- Retrain + promote all 4 disease models on the new data.
- Tests: update grouping-sensitive suites (`DynamicHotspotTest`,
  `ForecastSeriesTest`, `NationalScopeTest` where affected); add cases for
  5-part per-barangay grouping and 4-part back-compat. Full backend suite
  + frontend suite + `tsc` must pass.

## Out of scope
- Per-barangay covariate feeds (feed covers 3 demo municipalities).
- Historical backfill of barangay segments onto pre-existing keys.
- Model architecture changes (ridge per disease, unchanged features).
