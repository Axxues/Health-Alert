# Per-Barangay Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track surveillance at barangay granularity: 5-part SourceKeys, per-(municipality, barangay, disease) grouping, and ~50 new seeded barangay stations across Region 1.

**Architecture:** Add a `SplitKey` parser with back-compat (old keys yield empty barangay), switch the three grouping sites to composite keys, thread barangay through row IDs and the series endpoint, write it at upload time, and reseed via CSV upload + retrain.

**Tech Stack:** .NET 10 (xUnit), React + Leaflet + vitest frontend, SQL Server Express dev DB.

**Spec:** `docs/superpowers/specs/2026-10-06-per-barangay-tracking-design.md`

## Global Constraints

- No new dependencies (stdlib / already-installed only).
- No commits unless the user explicitly requests one (repo rule overrides the skill's default commit steps; end tasks with test verification instead).
- Backend tests run with: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --nologo -v q` from `D:\SILLAG-Project-1\system`.
- Frontend checks run from `D:\SILLAG-Project-1\system\src\frontend`: `npm run test -- --run` and `npx tsc --noEmit`.
- Seed names/coords beyond the current directory are best-known approximations, correctable via the Uploads page. Never invent epidemiology, only demo geography.

---

## File structure

- `src/backend/HealthAlert.Tools/RiskMapsGetTools.cs` — add `SplitKey`, use in `PlacesAsync` guard (already filters pipe-less), `Hotspots`, `LocationsAsync`, `SeriesAsync` (+ `brgy` param).
- `src/backend/HealthAlert.Tools/UploadTools.cs` — write 5-part keys.
- `src/backend/HealthAlert.Tools/DemoHistorySeeder.cs` — ~50 new `DemoPlace` rows.
- `src/backend/HealthAlert.Api/Controllers/ForecastController.cs` — `brgy` query param on `Series`.
- `src/backend/HealthAlert.Tests/BarangayGroupingTest.cs` — new behavior tests.
- `src/backend/HealthAlert.Tests/UploadPipelineTest.cs` — extend with 5-part key test (read file first for exact patterns).
- `src/frontend/src/services/forecast/api/locations.api.ts` — 3-part ID parsing + `brgy` series param.
- `src/frontend/src/services/forecast/api/locations.api.test.ts` — extend with 3-part ID test.

---

### Task 1: Key parser with back-compat

**Files:**
- Modify: `src/backend/HealthAlert.Tools/RiskMapsGetTools.cs`
- Test: `src/backend/HealthAlert.Tests/BarangayGroupingTest.cs` (create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `private static (string Muni, string Barangay) SplitKey(string key)` used by Tasks 3–5.

- [ ] **Step 1: Write the failing test**

```csharp
using HealthAlert.Database;
using HealthAlert.Tools;
using HealthAlert.Tools.ML;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class BarangayGroupingTest
{
    private static RiskMapsGetTools Maps(HealthAlertDbContext ctx) =>
        new(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions()));

    [Fact]
    public async Task Five_part_keys_group_per_barangay()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        var t0 = DateTime.UtcNow.Date;
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|San Nicolas|RHU|2026-W40|dengue", Count = 10, ReportedAt = t0 });
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|Poblacion|RHU|2026-W40|dengue", Count = 4, ReportedAt = t0 });
        await ctx.SaveChangesAsync();
        var rows = await Maps(ctx).LocationsAsync(null, null, "Agoo", "dengue", null);
        var mine = rows.Where(r => r.Municipality == "Agoo" && r.Disease == "dengue").ToList();
        Assert.Equal(2, mine.Count);
        Assert.Contains(mine, r => r.Barangay == "San Nicolas" && r.ActiveCases == 10);
        Assert.Contains(mine, r => r.Barangay == "Poblacion" && r.ActiveCases == 4);
    }

    [Fact]
    public async Task Four_part_keys_keep_empty_barangay()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|RHU Agoo|2026-W39|dengue", Count = 7, ReportedAt = DateTime.UtcNow.Date });
        await ctx.SaveChangesAsync();
        var spots = await Maps(ctx).Hotspots();
        var ago = spots.Where(s => s.Muni == "Agoo" && s.Disease == "dengue").ToList();
        Assert.NotEmpty(ago);
        Assert.All(ago, s => Assert.Equal("", s.Barangay));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --filter "BarangayGrouping" --nologo -v q`
Expected: FAIL (2 barangay rows collapse into 1; back-compat part passes trivially only after parser exists — both fail now because grouping ignores segment 1)

- [ ] **Step 3: Write minimal implementation**

Add next to `Prefix` in `RiskMapsGetTools.cs`:

```csharp
// ponytail: 5-part keys carry barangay in segment 1; older shapes fall back to the directory entry
private static (string Muni, string Barangay) SplitKey(string key)
{
    var parts = (key ?? "").Split('|');
    return parts.Length >= 5 ? (parts[0], parts[1]) : (parts[0], "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: same command as Step 2.
Expected: first test still FAILS (grouping not switched yet — Tasks 3–4 do that), second test PASSES. This is expected: Task 1 delivers the parser only. If the second test fails, fix `SplitKey` before continuing.

---

### Task 2: Upload writes 5-part keys

**Files:**
- Modify: `src/backend/HealthAlert.Tools/UploadTools.cs:109-117`
- Test: `src/backend/HealthAlert.Tests/UploadPipelineTest.cs` (extend — read the file first and follow its existing patterns)

**Interfaces:**
- Consumes: `barangay` CSV column (already in `TemplateColumns`).
- Produces: 5-part keys consumed by Task 1's `SplitKey`.

- [ ] **Step 1: Write the failing test**

The `Row` helper in `UploadPipelineTest.cs` already accepts a `barangay` argument (default `"Poblacion"`). Append:

```csharp
[Fact]
public async Task Barangay_column_writes_five_part_key()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var t = new UploadTools(ctx);
    var csv = string.Join("\n", Header,
        Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0, barangay: "Lucao"));
    var r = await t.IngestAsync(csv, "brgy.csv", "encoder1");
    Assert.Equal(1, r.Accepted);
    Assert.Equal("Agoo|Lucao|Agoo RHU|2026-W39|dengue",
        await ctx.Cases.Where(c => c.SourceKey != null).Select(c => c.SourceKey!).FirstAsync());
}

[Fact]
public async Task Empty_barangay_keeps_legacy_four_part_key()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var t = new UploadTools(ctx);
    var csv = string.Join("\n", Header,
        Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0, barangay: ""));
    var r = await t.IngestAsync(csv, "legacy.csv", "encoder1");
    Assert.Equal(1, r.Accepted);
    Assert.Equal("Agoo|Agoo RHU|2026-W39|dengue",
        await ctx.Cases.Where(c => c.SourceKey != null).Select(c => c.SourceKey!).FirstAsync());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --filter "UploadPipeline" --nologo -v q`
Expected: FAIL on the new tests (key has 4 segments).

- [ ] **Step 3: Write minimal implementation**

In `UploadTools.IngestAsync`, replace:

```csharp
key = $"{muni}|{facility}|{year}-W{week:D2}|{disease}";
```

with:

```csharp
var brgy = Get(cols, "barangay");
key = string.IsNullOrWhiteSpace(brgy)
    ? $"{muni}|{facility}|{year}-W{week:D2}|{disease}"
    : $"{muni}|{brgy}|{facility}|{year}-W{week:D2}|{disease}";
```

- [ ] **Step 4: Run test to verify it passes**

Run: same command as Step 2.
Expected: PASS (all `UploadPipeline` tests).

---

### Task 3: Per-barangay grouping in Locations + Hotspots

**Files:**
- Modify: `src/backend/HealthAlert.Tools/RiskMapsGetTools.cs` (`LocationsAsync`, `Hotspots`)
- Test: `src/backend/HealthAlert.Tests/BarangayGroupingTest.cs` (Task 1's first test goes green here)

**Interfaces:**
- Consumes: Task 1 `SplitKey`.
- Produces: barangay-scoped `LocationRow`/`HotspotRow` consumed by Task 6 frontend (already compatible).

- [ ] **Step 1: Confirm the failing test**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --filter "BarangayGrouping" --nologo -v q`
Expected: `Five_part_keys_group_per_barangay` FAILS.

- [ ] **Step 2: Write minimal implementation**

In `LocationsAsync`, replace the `groups` construction:

```csharp
var groups = recent
    .Where(c => c.DiseaseId.HasValue && codes.ContainsKey(c.DiseaseId.Value) && (c.SourceKey ?? "").Contains('|'))
    .GroupBy(c => (Muni: c.SourceKey!.Split('|', 2)[0], Disease: codes[c.DiseaseId!.Value]))
    .ToDictionary(g => g.Key, g => g.ToList());
```

with:

```csharp
var groups = recent
    .Where(c => c.DiseaseId.HasValue && codes.ContainsKey(c.DiseaseId.Value) && (c.SourceKey ?? "").Contains('|'))
    .GroupBy(c => { var (mu, br) = SplitKey(c.SourceKey!); return (Muni: mu, Barangay: br, Disease: codes[c.DiseaseId!.Value]); })
    .ToDictionary(g => g.Key, g => g.ToList());
```

and the lookup:

```csharp
groups.TryGetValue((p.Municipality, d), out var list);
```

with:

```csharp
groups.TryGetValue((p.Municipality, p.Barangay, d), out var list);
```

and the row id:

```csharp
$"{p.Municipality}|{d}".ToLowerInvariant().Replace(' ', '-'),
```

with:

```csharp
(string.IsNullOrWhiteSpace(p.Barangay) ? $"{p.Municipality}|{d}" : $"{p.Municipality}|{p.Barangay}|{d}").ToLowerInvariant().Replace(' ', '-'),
```

Apply the same `SplitKey` grouping change in `Hotspots` (both the `recent` GroupBy and the `have` parity-set key, which becomes `s.Muni + "|" + s.Barangay + "|" + s.Disease` and `p.Municipality + "|" + p.Barangay + "|" + d`).

- [ ] **Step 3: Run test to verify it passes**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --filter "BarangayGrouping|DynamicHotspot|ForecastSeries|NationalScope|DemoHistory" --nologo -v q`
Expected: PASS. If `Locations_returns_rows_with_cases_and_bands` or others fail on duplicate/count assumptions, fix the implementation (not the old tests) unless the old test hardcodes the 19-place directory — those literals were already parameterized to `Places.Length`; keep that pattern.

---

### Task 4: Series gains barangay filter

**Files:**
- Modify: `src/backend/HealthAlert.Tools/RiskMapsGetTools.cs` (`SeriesAsync`), `src/backend/HealthAlert.Api/Controllers/ForecastController.cs` (`Series`)
- Test: extend `src/backend/HealthAlert.Tests/ForecastSeriesTest.cs` (read file first; follow its setup with `TestDb.Create()` + seeded cases)

**Interfaces:**
- Consumes: Task 1 `SplitKey`.
- Produces: `SeriesAsync(string muni, string disease, string? brgy = null)`; `GET /api/forecast/series?muni=&disease=&brgy=`.

- [ ] **Step 1: Write the failing test**

Add a test that seeds two 5-part dengue rows for different barangays of one municipality across several weeks and asserts `SeriesAsync("Agoo", "dengue", "San Nicolas")` sums only that barangay's counts while `SeriesAsync("Agoo", "dengue")` sums both.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --filter "ForecastSeries" --nologo -v q`
Expected: build error CS1501 (no `SeriesAsync` overload takes 3 arguments) — the compile failure is the red step.

- [ ] **Step 3: Write minimal implementation**

```csharp
public async Task<ForecastSeries> SeriesAsync(string muni, string disease, string? brgy = null)
```

Replace the row filter:

```csharp
var rows = (await ctx.Cases.Where(c => c.DiseaseId == did).ToListAsync())
    .Where(c => (c.SourceKey ?? "").Split('|', 2)[0].Equals(muni, StringComparison.OrdinalIgnoreCase))
    .ToList();
```

with:

```csharp
var rows = (await ctx.Cases.Where(c => c.DiseaseId == did).ToListAsync())
    .Where(c => { var (mu, br) = SplitKey(c.SourceKey ?? ""); return mu.Equals(muni, StringComparison.OrdinalIgnoreCase) && (string.IsNullOrWhiteSpace(brgy) || br.Equals(brgy, StringComparison.OrdinalIgnoreCase)); })
    .ToList();
```

Controller:

```csharp
[HttpGet("series")]
public async Task<IActionResult> Series([FromQuery] string? muni, [FromQuery] string? disease, [FromQuery] string? brgy,
    [FromServices] RiskMapsGetTools g)
{
    if (string.IsNullOrWhiteSpace(muni)) return BadRequest(ApiResponse.Fail("BAD_REQUEST", "muni is required"));
    return Ok(ApiResponse.Ok(await g.SeriesAsync(muni, disease ?? "dengue", brgy)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: same command as Step 2.
Expected: PASS.

---

### Task 5: Frontend resolves 3-part IDs and passes brgy

**Files:**
- Modify: `src/frontend/src/services/forecast/api/locations.api.ts` (`getLocationDetail`)
- Test: `src/frontend/src/services/forecast/api/locations.api.test.ts` (extend)

**Interfaces:**
- Consumes: Task 3 row IDs (`muni|brgy|disease` slugs).
- Produces: correct entry resolution + series params `{ muni, disease, brgy }`.

- [ ] **Step 1: Write the failing test**

Add a test with two entries sharing a municipality but different barangays (`"agoo|san-nicolas|dengue"`, `"agoo|poblacion|dengue"` with matching `municipality`/`barangay` fields) asserting `getLocationDetail("agoo|san-nicolas|dengue")` resolves the San Nicolas entry and calls `/forecast/series` with `params: { muni: "Agoo", disease: "dengue", brgy: "San Nicolas" }`.

- [ ] **Step 2: Run test to verify it fails**

Run from `src/frontend`: `npm run test -- --run src/services/forecast/api/locations.api.test.ts`
Expected: FAIL (resolves the wrong entry / missing `brgy` param).

- [ ] **Step 3: Write minimal implementation**

Replace:

```ts
const diseaseHint = disease ?? (id.includes("|") ? id.split("|")[1] : undefined);
```

with parsing that treats the last segment as the disease when it matches a known disease code, else the middle segment(s) as barangay:

```ts
const KNOWN_DISEASES = ["dengue", "leptospirosis", "ili", "asthma"];
const parts = id.split("|");
const last = parts[parts.length - 1].toLowerCase().replace(/-/g, "");
const diseaseHint =
  disease ?? (KNOWN_DISEASES.includes(last) && parts.length > 1 ? parts[parts.length - 1] : undefined);
```

Match entries on municipality + barangay + disease: after the existing `norm(e.id) === needle` exact check, add a structured match comparing `norm(e.municipality)` to `norm(parts[0])`, `norm(e.barangay ?? "")` to the middle segment(s), and `e.disease` to the disease hint. Pass `brgy: entry.barangay || undefined` in the `/forecast/series` params.

- [ ] **Step 4: Run test to verify it passes**

Run: same command as Step 2, plus `npx tsc --noEmit`.
Expected: PASS, tsc exit 0.

---

### Task 6: Seed ~50 barangay stations and reseed the dev DB

**Files:**
- Modify: `src/backend/HealthAlert.Tools/DemoHistorySeeder.cs` (`Places`)
- No new test file: `DemoHistoryTest` already asserts counts via `Places.Length` (self-adapting).

**Interfaces:**
- Consumes: Tasks 1–3 (grouping/IDs handle duplicate municipalities).
- Produces: ~69-station directory; reseed via existing CSV upload endpoint.

Seed rules: keep all 19 existing entries byte-identical; add ~50 new `DemoPlace` rows as (a) 2nd/3rd barangays in existing towns and (b) a few new towns limited to well-known Region 1 municipalities. Same-town stations share the town coords with ±0.001–0.003 deterministic jitter (documented inline: real barangays sit hundreds of meters apart; keeps merged map nodes from stacking). Barangay names beyond the current directory are best-known approximations. New towns also get `RiskMapsGetTools.Coords()` entries and frontend `MUNICIPALITIES_BY_PROVINCE` list additions (check current lists first — several already contain the names).

- [ ] **Step 1: Add the DemoPlace rows + Coords + frontend lists**
- [ ] **Step 2: Run backend suite**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --nologo -v q`
Expected: PASS (78+ tests; `DemoHistoryTest` adapts via `Places.Length`).

- [ ] **Step 3: Reseed the dev DB (ops, no commit)**

```powershell
sqlcmd -S "localhost\SQLEXPRESS" -d HealthAlert_MVP -Q "SET QUOTED_IDENTIFIER ON; DELETE FROM tblUploadIssues; DELETE FROM tblUploadBatches; DELETE FROM tblCases;"
```

Regenerate the seed CSV (extend the `gen_region1_seed.py` pattern: one row per place × disease × 8 weeks, `barangay` column filled), upload via `POST /api/surveillance/upload` with an Admin JWT (`POST /api/auth/login` `{"username":"guest"}`), then retrain + promote per disease (`/api/forecast/train`, `/api/forecast/promote/{id}`) and verify: `GET /api/forecast/locations` shows ~69 stations, 0 junk rows, distinct probabilities.

---

### Task 7: Full verification

- [ ] **Step 1: Run the full backend suite**

Run: `dotnet test src/backend/HealthAlert.Tests/HealthAlert.Tests.csproj -c Release --nologo -v q`
Expected: PASS, 0 failures.

- [ ] **Step 2: Run frontend suite + typecheck**

Run from `src/frontend`: `npm run test -- --run` then `npx tsc --noEmit`.
Expected: all files pass, tsc exit 0.

- [ ] **Step 3: Verify live matrix**

`GET /api/forecast/locations` → ~69 stations; spot-check a multi-barangay town (e.g. Agoo) returns one row per barangay with distinct `barangay` values and no duplicate IDs.
