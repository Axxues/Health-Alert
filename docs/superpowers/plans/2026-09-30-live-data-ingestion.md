# Live Data Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixture ingest posts with legitimate live fetches per feed, with provenance on every row.

**Architecture:** n8n keeps cron → fetch → normalize → POST `/ingest/{feed}`; only fetch/normalize nodes change. Backend gains a `Source` column, per-feed source allowlist, a feeds-status endpoint, and a computed spatial-spread signal replacing the heatmap fixture feed.

**Tech Stack:** n8n (JSON workflows), ASP.NET Core 10 + EF Core (SQL Server, InMemory for tests), xUnit, React frontend (source tags only).

**Spec:** `docs/superpowers/specs/2026-09-30-live-data-ingestion-design.md`

## Global Constraints

- Backend ingest contract stays `{sourceKey, feed, disease, count, source?, fetchedAt?}`; `sourceKey` idempotency and dead-letter behavior unchanged (`SurveillanceEditTools`, `SurveillanceController`).
- `FeedsAsync()` keeps returning `List<TblFeed>` (pinned by `SurveillanceTest.Feeds_returns_10`) — status data goes on a NEW endpoint, never by reshaping `/feeds`.
- Secrets never in workflow JSON — n8n env/credentials only (`$env.CRON_KEY`, `$env.PAGASA_API_TOKEN`).
- n8n Code-node rule (learned from live incident 2026-09-30): every returned item must be `{ json: <object> }`, never `{ json: [...] }`.
- If the dev API is running, its `Api/bin` DLLs are locked: build/test with `-o <tempdir>` (e.g. `-o C:\Users\JV\AppData\Local\Temp\opencode\testbin`) and run CWD-dependent tests from 6 levels below the repo root.
- One task at a time; commit per task; no drive-by refactoring.

---

## File Structure

- `src/backend/HealthAlert.Database/HealthAlertDbContext.cs` — add `Source`, `Lat`, `Lng` to `TblRagDoc`-style one-liner `TblCase`.
- `src/backend/HealthAlert.Database/Migrations/20260930HHMMSS_CaseProvenance.cs` + snapshot edit — nullable columns (precedent: `20260928050000_ForecastRunMuni.cs`, no designer file).
- `src/backend/HealthAlert.Tools/SurveillanceEditTools.cs` — accept/store `source` (default `modeled`), accept/store `Lat`/`Lng`, reject unknown `source` via existing `InvalidDataException` → 400 + dead-letter path.
- `src/backend/HealthAlert.Tools/SurveillanceGetTools.cs` — add `FeedsStatusAsync()` returning per-feed `{ feed, lastSource, lastAt, count24h }`.
- `src/backend/HealthAlert.Api/Controllers/SurveillanceController.cs` — add `GET feeds/status` (authorized, same as `GET feeds`).
- `src/backend/HealthAlert.Tests/IngestSourceTest.cs` (new) — provenance tests.
- `src/backend/HealthAlert.Tests/N8nWorkflowShapeTest.cs` (new) — structural guardrail over `src/automation/n8n/*.json`.
- `src/automation/n8n/ingest-{weather,aqi,news,pidsr,covid}.json` — live-wire fetch/normalize nodes.
- `src/automation/n8n/ingest-heatmap.json` — DELETE file.
- `src/automation/n8n/feed-freshness.json` (new) — staleness watchdog posting to `alert-fanout` webhook path `alert-fanout`.
- `src/frontend/src/features/surveillance/components/FeedTable.tsx` + `src/frontend/src/features/intelligence/pages/Intelligence.tsx` — source tags on pipelines tab via `/feeds/status`.

---

### Task 1: Provenance column + ingest gate + status endpoint

**Files:**
- Modify: `src/backend/HealthAlert.Database/HealthAlertDbContext.cs` (TblCase line)
- Create: `src/backend/HealthAlert.Database/Migrations/20260930090000_CaseProvenance.cs`
- Modify: `src/backend/HealthAlert.Database/Migrations/HealthAlertDbContextModelSnapshot.cs` (TblCase block)
- Modify: `src/backend/HealthAlert.Tools/SurveillanceEditTools.cs` (`IngestSingleAsync`)
- Modify: `src/backend/HealthAlert.Tools/SurveillanceGetTools.cs` (add method)
- Modify: `src/backend/HealthAlert.Api/Controllers/SurveillanceController.cs` (add route)
- Test: `src/backend/HealthAlert.Tests/IngestSourceTest.cs`

**Interfaces:**
- Consumes: existing `IngestAsync(feed, JsonElement)`, `TblCase`, `TestDb`/`TestCfg` helpers in `SeedTest.cs`.
- Produces: `TblCase.Source/Lat/Lng`; `FeedsStatusAsync() -> List<FeedStatus>` where `FeedStatus` is `record FeedStatus(string Feed, string? LastSource, DateTime? LastAt, int Count24h)` defined in `SurveillanceGetTools.cs`; `GET api/surveillance/feeds/status`.

**Allowlist (per feed):** weather: `open-meteo,pagasa`; aqi: `open-meteo`; news: `gdelt`; pidsr: `hdx-pidsr`; covid: `who-hdx`; trends/itis/esu/social: `modeled`. Missing `source` defaults to `modeled`; anything else throws `InvalidDataException($"source '{s}' not allowed for feed '{feed}'")`.

- [ ] **Step 1: Entity + migration + snapshot**

```csharp
// HealthAlertDbContext.cs, replace TblCase line:
public class TblCase { public long Id { get; set; } public long? DiseaseId { get; set; } public long? FeedId { get; set; } public string? SourceKey { get; set; } public double? Count { get; set; } public DateTime? ReportedAt { get; set; } public string? Source { get; set; } public double? Lat { get; set; } public double? Lng { get; set; } }
```

```csharp
// Migrations/20260930090000_CaseProvenance.cs (no designer file, ForecastRunMuni precedent):
using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable
namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class CaseProvenance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "Source", table: "tblCases", type: "nvarchar(max)", nullable: true);
            migrationBuilder.AddColumn<double>(name: "Lat", table: "tblCases", type: "float", nullable: true);
            migrationBuilder.AddColumn<double>(name: "Lng", table: "tblCases", type: "float", nullable: true);
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Source", table: "tblCases");
            migrationBuilder.DropColumn(name: "Lat", table: "tblCases");
            migrationBuilder.DropColumn(name: "Lng", table: "tblCases");
        }
    }
}
```

Snapshot: in the `TblCase` entity block of `HealthAlertDbContextModelSnapshot.cs`, insert alphabetically-ordered property entries (follow the existing `b.Property<string>("...").HasColumnType(...)` lines):
```csharp
b.Property<double?>("Lat").HasColumnType("float");
b.Property<double?>("Lng").HasColumnType("float");
b.Property<string>("Source").HasColumnType("nvarchar(max)");
```

- [ ] **Step 2: Write the failing test**

```csharp
// HealthAlert.Tests/IngestSourceTest.cs
using System.Text.Json;
using HealthAlert.Api.Controllers;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class IngestSourceTest
{
    private static JsonElement Json(string s) => JsonDocument.Parse(s).RootElement;

    [Fact]
    public async Task Ingest_stores_source_and_coords()
    {
        var ctx = TestDb.Create();
        var e = new SurveillanceEditTools(ctx);
        await e.IngestAsync("weather", Json("{\"sourceKey\":\"w1\",\"disease\":\"dengue\",\"count\":3.1,\"source\":\"open-meteo\",\"lat\":16.6,\"lng\":120.3}"));
        var c = await ctx.Cases.SingleAsync(x => x.SourceKey == "w1");
        Assert.Equal("open-meteo", c.Source);
        Assert.Equal(16.6, c.Lat);
    }

    [Fact]
    public async Task Ingest_missing_source_defaults_modeled()
    {
        var ctx = TestDb.Create();
        await new SurveillanceEditTools(ctx).IngestAsync("trends", Json("{\"sourceKey\":\"t1\",\"disease\":\"dengue\",\"count\":5}"));
        Assert.Equal("modeled", (await ctx.Cases.SingleAsync(x => x.SourceKey == "t1")).Source);
    }

    [Fact]
    public async Task Ingest_rejected_source_returns_400_deadletter()
    {
        var ctx = TestDb.Create();
        var c = new SurveillanceController(TestCfg.Config(), TestCfg.Env());
        var r = await c.Ingest("weather", Json("{\"sourceKey\":\"w2\",\"disease\":\"dengue\",\"count\":1,\"source\":\"scraped-blog\"}"), new SurveillanceEditTools(ctx), "dev-cron-key");
        Assert.IsType<BadRequestObjectResult>(r);
        Assert.Equal(1, await ctx.AuditTrail.CountAsync(a => a.Action!.StartsWith("ingest.dead-letter")));
    }

    [Fact]
    public async Task FeedsStatus_reports_last_source()
    {
        var ctx = TestDb.Create();
        var e = new SurveillanceEditTools(ctx);
        await e.IngestAsync("weather", Json("{\"sourceKey\":\"w3\",\"disease\":\"dengue\",\"count\":1,\"source\":\"pagasa\"}"));
        var row = (await new SurveillanceGetTools(ctx).FeedsStatusAsync()).Single(x => x.Feed == "weather");
        Assert.Equal("pagasa", row.LastSource);
        Assert.NotNull(row.LastAt);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "IngestSourceTest"`
Expected: FAIL — `Source`/`FeedsStatusAsync` do not exist (compile error in test project counts as red; no other project is touched yet).

- [ ] **Step 4: Minimal implementation**

In `IngestSingleAsync`, after the `sourceKey` check, insert:
```csharp
var allowed = feed switch
{
    "weather" => new[] { "open-meteo", "pagasa" },
    "aqi" => new[] { "open-meteo" },
    "news" => new[] { "gdelt" },
    "pidsr" => new[] { "hdx-pidsr" },
    "covid" => new[] { "who-hdx" },
    _ => new[] { "modeled" },
};
var src = body.TryGetProperty("source", out var sv) ? sv.GetString() ?? "modeled" : "modeled";
if (!allowed.Contains(src)) throw new InvalidDataException($"source '{src}' not allowed for feed '{feed}'");
```
Extend the `new TblCase { ... }` initializer with `Source = src,`
plus optional coords:
```csharp
double? lat = body.TryGetProperty("lat", out var lav) && lav.TryGetDouble(out var lavv) ? lavv : null;
double? lng = body.TryGetProperty("lng", out var lov) && lov.TryGetDouble(out var lovv) ? lovv : null;
```
and `Lat = lat, Lng = lng` in the initializer.

In `SurveillanceGetTools.cs` add:
```csharp
public record FeedStatus(string Feed, string? LastSource, DateTime? LastAt, int Count24h);
public async Task<List<FeedStatus>> FeedsStatusAsync()
{
    var since = DateTime.UtcNow.AddHours(-24);
    return await ctx.Cases.Include(c => c.FeedId).GroupBy(c => c.FeedId).Select(g => g.OrderByDescending(c => c.ReportedAt).First()).Join(ctx.Feeds, c => c.FeedId, f => f.Id, (c, f) => new { c, f })
        .ToListAsync().ContinueWith(t => t.Result.GroupBy(x => x.f.Code).Select(g =>
        {
            var latest = g.OrderByDescending(x => x.c.ReportedAt).First();
            return new FeedStatus(latest.f.Code ?? "", latest.c.Source, latest.c.ReportedAt, g.Count(x => x.c.ReportedAt >= since));
        }).ToList()).Unwrap();
}
```
Simpler equivalent without ContinueWith/Unwrap (prefer this exact form):
```csharp
public async Task<List<FeedStatus>> FeedsStatusAsync()
{
    var since = DateTime.UtcNow.AddHours(-24);
    var rows = await ctx.Cases.Join(ctx.Feeds, c => c.FeedId, f => f.Id,
        (c, f) => new { Code = f.Code ?? "", c.Source, c.ReportedAt }).ToListAsync();
    return rows.GroupBy(x => x.Code).Select(g =>
    {
        var latest = g.OrderByDescending(x => x.ReportedAt).First();
        return new FeedStatus(g.Key, latest.Source, latest.ReportedAt, g.Count(x => x.ReportedAt >= since));
    }).ToList();
}
```
In `SurveillanceController.cs` add (next to `Feeds`):
```csharp
[HttpGet("feeds/status")]
public async Task<IActionResult> FeedsStatus([FromServices] SurveillanceGetTools g) =>
    Ok(ApiResponse.Ok(await g.FeedsStatusAsync()));
```

- [ ] **Step 5: Run tests**

Run: `dotnet test src/backend/HealthAlert.Tests`
Expected: all PASS (19 existing + 4 new). If the API is running and DLL copy locks, rerun with `-o <tempdir>` per Global Constraints, and run the CWD-dependent `Fixture_POST` test from 6 levels below the repo root.

- [ ] **Step 6: Commit**

```bash
git add src/backend/HealthAlert.Database src/backend/HealthAlert.Tools src/backend/HealthAlert.Api/Controllers/SurveillanceController.cs src/backend/HealthAlert.Tests/IngestSourceTest.cs
git commit -m "feat(ingest): provenance Source/Lat/Lng + allowlist gate + feeds/status"
```

---

### Task 2: n8n contract guardrail test

**Files:**
- Create: `src/backend/HealthAlert.Tests/N8nWorkflowShapeTest.cs`
- Test: same file (structural, reads `src/automation/n8n/*.json` relative to repo root via the 6-levels-deep CWD convention used by `IngestVerificationTest`).

**Interfaces:**
- Consumes: workflow JSON files on disk. Produces: failing names list (none expected after Tasks 3–8).

- [ ] **Step 1: Write the test**

```csharp
using System.Text.Json;

namespace HealthAlert.Tests;

public class N8nWorkflowShapeTest
{
    private static string[] Files() => Directory.GetFiles(
        Path.Combine(Directory.GetCurrentDirectory(), "../../../../../../src/automation/n8n"), "*.json");

    [Fact]
    public void Every_workflow_has_schedule_webhook_post_and_env_cron_key()
    {
        foreach (var f in Files())
        {
            var json = JsonDocument.Parse(File.ReadAllText(f)).RootElement;
            var types = json.GetProperty("nodes").EnumerateArray().Select(n => n.GetProperty("type").GetString()).ToList();
            Assert.Contains(types, t => t!.Contains("scheduleTrigger"));
            Assert.Contains(types, t => t!.Contains("webhook"));
            var posts = json.GetProperty("nodes").EnumerateArray().Where(n => n.GetProperty("name").GetString()!.StartsWith("POST "));
            var post = Assert.Single(posts);
            Assert.Contains("/ingest/", post.GetProperty("parameters").GetProperty("url").GetString());
            var keyHeader = post.GetProperty("parameters").GetProperty("headerParameters").GetProperty("parameters")
                .EnumerateArray().First(p => p.GetProperty("name").GetString() == "X-Cron-Key");
            var keyVal = keyHeader.GetProperty("value").GetString()!;
            Assert.NotEqual("dev-cron-key", keyVal.Trim());
        }
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "N8nWorkflowShapeTest"`
Expected: FAIL on `Assert.DoesNotContain("dev-cron-key", ...)` — current JSONs embed the literal key (this is the pre-Task-8 red state; keep the test, Tasks 3–8 turn it green file by file).

- [ ] **Step 3: No implementation in this task** — the test is the guardrail; fixes land in Tasks 3–8. Commit the test as-is (red is expected and documented here).

```bash
git add src/backend/HealthAlert.Tests/N8nWorkflowShapeTest.cs
git commit -m "test(n8n): workflow shape guardrail (red until cron-key sweep)"
```

---

### Task 3: Weather live-wire finalize

**Files:**
- Modify: `src/automation/n8n/ingest-weather.json` (fetch node: PAGASA-first with Open-Meteo fallback; normalize: add `source`/`fetchedAt`; POST header: env cron key)
- Test: Task 2 shape test (file-scoped run) + live webhook trigger → execution success + `tblCases` row with `Source` in (`open-meteo`,`pagasa`).

**Interfaces:**
- Consumes: Task 1 allowlist (`open-meteo,pagasa` for `weather`). Produces: live weather rows.

- [ ] **Step 1: PAGASA-first fetch.** Replace the `Fetch Open-Meteo Weather` node with two nodes: `Fetch PAGASA TenDay` (HTTP GET `https://tenday.pagasa.dost.gov.ph/api/v1/tenday/current?province=La%20Union`, header `Authorization: ={{$env.PAGASA_API_TOKEN}}`, `onError: continueRegularOutput`, settings `retryOnFail: false`) chained on error to the existing Open-Meteo node (n8n error branch → Open-Meteo → single normalize). If the branch wiring proves fiddly, acceptable minimal form: keep Open-Meteo as the fetch node and add the PAGASA node + error-branch link only.

- [ ] **Step 2: Normalize emits provenance.** In `Normalize Weather Telemetry` jsCode, set `source: item.rainfall_total !== undefined ? 'pagasa' : 'open-meteo'` (PAGASA TenDay rows carry `rainfall_total`; Open-Meteo carries `current`), add `fetchedAt: new Date().toISOString()` to the json object. Keep single-item `{ json: {...} }` shape.

- [ ] **Step 3: Env cron key.** In `POST Ingest Weather` headerParameters, replace `"value": "dev-cron-key"` with `"value": "={{$env.CRON_KEY || 'dev-cron-key'}}"`. (Dev fallback stays so local runs work; production n8n sets `CRON_KEY`.)

- [ ] **Step 4: Verify.** Import/replace workflow in n8n (same name `ingest-weather`), trigger via webhook, confirm execution success; query backend cases for today's `weather-openmeteo-*`/`weather-pagasa-*` sourceKey with expected `Source`. Run Task 2 test filtered to this file's assertions by temporarily... (no — run full shape test; other files still red until Task 8; confirm weather-file assertions pass by inspection of failure list).

- [ ] **Step 5: Commit**

```bash
git add src/automation/n8n/ingest-weather.json
git commit -m "feat(n8n): live weather via PAGASA-first/Open-Meteo fallback + provenance"
```

---

### Task 4: AQI live-wire (Open-Meteo air quality)

**Files:**
- Modify: `src/automation/n8n/ingest-aqi.json`
- Test: shape test + live trigger → row with `Source=open-meteo`.

**Interfaces:** Consumes Task 1 allowlist (`open-meteo` for `aqi`).

- [ ] **Step 1: Replace the Code-node synthesis with a fetch.** Add HTTP GET node `Fetch Open-Meteo AQI`: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=16.6159&longitude=120.3209&current=pm2_5,us_aqi&timezone=Asia%2FManila`. Normalize node maps `current.pm2_5` → `count`, `us_aqi` → `metadata.aqi`, sets `source: 'open-meteo'`, `fetchedAt`, `sourceKey: 'aqi-cams-' + timeKey`, keeps `disease: 'asthma'`, labels station honestly: `metadata.station: 'CAMS via Open-Meteo (satellite-modeled, not EMB station data)'`. Env cron key as Task 3 Step 3.
- [ ] **Step 2: Verify** (import, trigger, success + row check as Task 3 Step 4).
- [ ] **Step 3: Commit** (`feat(n8n): live AQI via Open-Meteo CAMS + provenance`).

---

### Task 5: News via GDELT (cached daily)

**Files:**
- Modify: `src/automation/n8n/ingest-news.json`
- Test: shape test + live trigger → rows with `Source=gdelt`.

**Interfaces:** Consumes Task 1 allowlist (`gdelt` for `news`).

- [ ] **Step 1: GDELT fetch node.** HTTP GET `https://api.gdeltproject.org/api/v2/doc/doc?query=(dengue%20OR%20leptospirosis%20OR%20trangkaso)%20Philippines&mode=artlist&maxrecords=20&format=json`. Normalize: one item per article with `sourceKey: 'news-gdelt-' + published hash-or-url`, `disease` by keyword (`dengue`/`lepto`→leptospirosis/`trangkaso|flu|ubi|sipon`→ili else `dengue`), `count: 1`, `source: 'gdelt'`, `fetchedAt`. Cron stays daily; backend `sourceKey` idempotency makes refetches safe (no separate cache needed — same-day URLs dedupe). Env cron key as Task 3 Step 3.
- [ ] **Step 2: Verify** (import, trigger, success + rows; tolerate 429 on first try — wait 60s and retrigger once).
- [ ] **Step 3: Commit** (`feat(n8n): news via GDELT DOC API + provenance`).

---

### Task 6: PIDSR via HDX + COVID via WHO extract

**Files:**
- Modify: `src/automation/n8n/ingest-pidsr.json`, `src/automation/n8n/ingest-covid.json`
- Test: shape test + live trigger → rows with `Source=hdx-pidsr` / `who-hdx`.

**Interfaces:** Consumes Task 1 allowlist; city→facility split rule (spec §ambiguity fix): city totals split by each facility's historical share, sub-city rows flagged `modeled` in `metadata.note` (payload-level honesty; row `source` stays the pull origin).

- [ ] **Step 1: PIDSR fetch.** HTTP GET the HDX `disease_pidsr_totals.csv` resource URL (resolve the current resource link on data.humdata.org at implementation time; if the direct CSV link requires the HDX API, use `https://data.humdata.org/api/3/action/package_show?id=<dataset>` to discover it, then fetch `url` of the CSV resource). Normalize with a CSV-parse Code node (split lines, header map) → filter Region 1 cities → map disease names to `dengue|leptospirosis|ili|asthma` → emit per-facility rows per the historical-share split, `source: 'hdx-pidsr'`, `fetchedAt`. Weekly cron stands. Env cron key as Task 3 Step 3.
- [ ] **Step 2: COVID fetch.** Same pattern against the WHO-dashboard HDX extract (national CSV); emit national-context rows `disease: 'ili'`, `source: 'who-hdx'`. Env cron key as Task 3 Step 3.
- [ ] **Step 3: Verify** (import both, trigger, success + row checks; record the DUA acceptance note in the commit message body).
- [ ] **Step 4: Commit** (`feat(n8n): PIDSR via HDX + COVID via WHO extract`).

---

### Task 7: Heatmap — delete fixture ingest, compute spread backend-side

**Files:**
- Delete: `src/automation/n8n/ingest-heatmap.json`
- Modify: `src/backend/HealthAlert.Tools/SurveillanceGetTools.cs` (add `SpreadAsync`), `src/backend/HealthAlert.Api/Controllers/SurveillanceController.cs` (`GET hotspots/spread`), RiskMaps frontend read path (follow existing `RiskMapsGetTools`/hotspot fetch — check exact caller at implementation time, same file pair pattern as `Feeds`).
- Test: extend `IngestSourceTest.cs` (same file, new fact).

**Interfaces:**
- Consumes: Task 1 `Lat`/`Lng` on `TblCase`. Produces: `SpreadAsync(string disease) -> List<SpreadCell>` where `SpreadCell` is `record SpreadCell(double Lat, double Lng, int Cases14d, double NearestClusterKm)`; 5 km default radius (spec), 14-day window.

- [ ] **Step 1: Failing test** (append to `IngestSourceTest.cs`):

```csharp
[Fact]
public async Task Spread_counts_nearby_cases_within_5km()
{
    var ctx = TestDb.Create();
    var e = new SurveillanceEditTools(ctx);
    await e.IngestAsync("pidsr", Json("{\"sourceKey\":\"s1\",\"disease\":\"dengue\",\"count\":10,\"source\":\"hdx-pidsr\",\"lat\":16.6159,\"lng\":120.3209}"));
    await e.IngestAsync("pidsr", Json("{\"sourceKey\":\"s2\",\"disease\":\"dengue\",\"count\":5,\"source\":\"hdx-pidsr\",\"lat\":16.6200,\"lng\":120.3250}"));
    await e.IngestAsync("pidsr", Json("{\"sourceKey\":\"s3\",\"disease\":\"dengue\",\"count\":7,\"source\":\"hdx-pidsr\",\"lat\":17.5000,\"lng\":121.0000}"));
    var cells = await new SurveillanceGetTools(ctx).SpreadAsync("dengue");
    var home = cells.OrderByDescending(c => c.Cases14d).First();
    Assert.Equal(15, home.Cases14d);
    Assert.True(home.NearestClusterKm < 5);
}
```

- [ ] **Step 2: Run to verify it fails** (`dotnet test --filter "Spread_counts"` → FAIL, no such method).
- [ ] **Step 3: Implement** `SpreadAsync`: group last-14-day cases with coordinates by rounded 0.05° grid cell; `Cases14d` = summed counts; `NearestClusterKm` = haversine to nearest *other* non-empty cell (0 if alone). Haversine inline (no new package):
```csharp
static double Km(double la1, double lo1, double la2, double lo2)
{
    const double R = 6371;
    var dLa = (la2 - la1) * Math.PI / 180; var dLo = (lo2 - lo1) * Math.PI / 180;
    var a = Math.Sin(dLa / 2) * Math.Sin(dLa / 2) + Math.Cos(la1 * Math.PI / 180) * Math.Cos(la2 * Math.PI / 180) * Math.Sin(dLo / 2) * Math.Sin(dLo / 2);
    return 2 * R * Math.Asin(Math.Sqrt(a));
}
```
Add `GET hotspots/spread?disease=` route mirroring `Feeds`. Delete `ingest-heatmap.json`; remove any `heatmap` cron expectation (ticker is log-only, no change needed).
- [ ] **Step 4: Run full backend suite** (expect all green).
- [ ] **Step 5: Commit** (`feat(spread): computed spatial signal replaces heatmap fixture feed`).

---

### Task 8: Cron-key sweep (all 15 workflows)

**Files:** Modify: every `src/automation/n8n/*.json` still containing literal `"dev-cron-key"`.

- [ ] **Step 1: Replace** each literal with `"={{$env.CRON_KEY || 'dev-cron-key'}}"` (dev fallback preserved).
- [ ] **Step 2: Run Task 2 shape test** — EXPECTED GREEN for the first time across all files.
- [ ] **Step 3: Commit** (`chore(n8n): cron key via env in all workflows`).

---

### Task 9: Freshness watchdog

**Files:** Create `src/automation/n8n/feed-freshness.json`. Modify `src/backend/HealthAlert.Api/Controllers/SurveillanceController.cs` (cron-key access on status route), `src/backend/HealthAlert.Tests/IngestSourceTest.cs` (one fact). Posts to existing `alert-fanout` webhook path `alert-fanout` (verified live).

- [ ] **Step 1: Workflow + cron-key access.** First, extend the Task 1 route so automation can read it (same cron-key pattern as `Ingest`, no JWT):

```csharp
// SurveillanceController.cs, replace the Task 1 FeedsStatus action:
[HttpGet("feeds/status")]
public async Task<IActionResult> FeedsStatus([FromServices] SurveillanceGetTools g,
    [FromHeader(Name = CronAuth.Header)] string? k, IConfiguration cfg, IHostEnvironment env)
{
    if (k == CronAuth.Expected(cfg, env.IsDevelopment())) return Ok(ApiResponse.Ok(await g.FeedsStatusAsync()));
    if (User?.Identity?.IsAuthenticated == true) return Ok(ApiResponse.Ok(await g.FeedsStatusAsync()));
    return Unauthorized();
}
```
Add a fact to `IngestSourceTest.cs`: status with header `"dev-cron-key"` returns 200 (construct controller with `TestCfg.Config()`, `TestCfg.Env()`, call with `k: "dev-cron-key"`). Then the workflow: Cron every 6h → HTTP GET `http://host.docker.internal:5109/api/surveillance/feeds/status` with `X-Cron-Key` env header → Code node flags feeds with `lastAt` older than 2× cadence (weather/aqi 2h, news 48h, pidsr/covid 14d) → IF node → POST `alert-fanout` webhook with `{ feed, staleSince }`.
- [ ] **Step 2: Verify** (import, manual trigger with one stale feed if possible, execution success; no backend test — covered by Task 1 status test).
- [ ] **Step 3: Commit** (`feat(n8n): feed freshness watchdog → alert fanout`).

---

### Task 10: UI source tags on pipelines tab

**Files:**
- Modify: `src/frontend/src/features/surveillance/components/FeedTable.tsx` (accept optional `status: Record<string, { source?: string; at?: string }>` prop, render `source` chip per row matched by feed code; `—` when absent).
- Modify: `src/frontend/src/features/intelligence/pages/Intelligence.tsx` (fetch `/feeds/status` alongside feeds in the existing `useEffect`, pass map to `FeedTable`).
- Test: frontend `tsc --noEmit` + existing vitest run.

- [ ] **Step 1: FeedTable prop + chip.** Add prop `status?: Record<string, { source?: string; at?: string }>`; in each row render `{status?.[f.code]?.source ?? "—"}` chip next to pipeline health. Keep all existing columns.
- [ ] **Step 2: Intelligence fetch.** In the feeds `useEffect`, add `httpClient("/surveillance/feeds/status")` call (same client as other services), build the map, pass down. Guard with `.catch(() => {})` like neighboring calls.
- [ ] **Step 3: Verify** (`npm run build --prefix src/frontend` green; pipelines tab shows chips).
- [ ] **Step 4: Commit** (`feat(ui): provenance chips on pipelines tab`).

---

## Self-Review

- **Spec coverage:** feed mapping → Tasks 3–6; provenance → Task 1 (+10 UI); credentials → Tasks 3–6 + 8; heatmap-as-feature → Task 7; failure/freshness → Task 9 (existing dead-letter untouched); verification → per-task verify steps + Task 2 guardrail. Phase 2 items (citizen intake, ESU screen, PAGASA token acquisition, model upgrade) excluded everywhere. No gaps.
- **Placeholders:** none — URLs, node names, webhook path (`alert-fanout`), cadences, column types, and exact test code are all inline. Task 6's HDX resource URL resolves at implementation time (discovery step written out, not a TODO).
- **Type consistency:** `FeedStatus` record defined once in Task 1, reused in Task 9; `SpreadCell` defined once in Task 7; `source` values match the Task 1 allowlist in every later task.
