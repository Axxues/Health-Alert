# Covariate Feeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pull weather, air-quality, and search-interest covariates from free keyless APIs into `tblCovariateReadings` on the existing hourly ticker.

**Architecture:** New `CovariateTools` parses provider JSON (pure functions, unit-tested on fixtures) and upserts readings; `IngestTickerService` calls it on the daily gate. Consumers read the table, never the APIs.

**Tech Stack:** .NET 10, EF Core, xUnit, Open-Meteo forecast/archive/air-quality APIs, Wikimedia pageviews API.

**Spec:** `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §2

## Global Constraints

- Disease scope stays dengue/leptospirosis/ili/asthma.
- Google scraping is rejected; Wikimedia pageviews is the search-interest proxy.
- Failure policy: last good reading stands, failure logged, reading date visible.
- Migrations ship seeded fallback rows so the system runs offline on first boot.
- TDD: failing test first for every task; commit per task.

---

### Task 1: `TblCovariateReading` entity + migration + seed fallback

**Files:**
- Modify: `src/backend/HealthAlert.Database/HealthAlertDbContext.cs`
- Test: `src/backend/HealthAlert.Tests/CovariateSeedTest.cs`

**Interfaces:**
- Consumes: existing `Seed.RunAsync` pattern.
- Produces: `TblCovariateReading { Id, Place, Date, Source, Payload }`, `DbSet<CovariateReadings>`, table `tblCovariateReadings`.

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public async Task Seed_writes_offline_covariate_fallback()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    Assert.True(await ctx.CovariateReadings.AnyAsync(c => c.Source == "seed-fallback"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "CovariateSeedTest" 2>&1`
Expected: FAIL (no `CovariateReadings` member).

- [ ] **Step 3: Write minimal implementation**

```csharp
public class TblCovariateReading { public long Id { get; set; } public string? Place { get; set; } public DateTime? Date { get; set; } public string? Source { get; set; } public string? Payload { get; set; } }
```

DbSet + `m.Entity<TblCovariateReading>().ToTable("tblCovariateReadings");` plus seed block:

```csharp
if (!await c.CovariateReadings.AnyAsync())
{
    c.CovariateReadings.Add(new TblCovariateReading { Place = "San Fernando City", Date = new DateTime(2026, 9, 27), Source = "seed-fallback", Payload = "{\"rainMm\":112.5,\"tempC\":31.4,\"aqi\":42,\"pageviews\":180}" });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "CovariateSeedTest" 2>&1`
Expected: PASS.

- [ ] **Step 5: Add migration**

Run: `dotnet ef migrations add AddCovariateReadings --project src/backend/HealthAlert.Database --startup-project src/backend/HealthAlert.Api 2>&1`
Expected: new `Migrations/*_AddCovariateReadings.cs` created.

- [ ] **Step 6: Commit**

```bash
git add src/backend/HealthAlert.Database src/backend/HealthAlert.Tests
git commit -m "feat: covariate readings table with offline seed fallback"
```

### Task 2: Provider JSON parsers (pure, fixture-tested)

**Files:**
- Create: `src/backend/HealthAlert.Tools/CovariateTools.cs`
- Test: `src/backend/HealthAlert.Tests/CovariateParseTest.cs`

**Interfaces:**
- Consumes: `TblCovariateReading`, raw provider JSON strings.
- Produces: `static (double RainMm, double TempC) ParseForecast(string json)`, `static int ParseAqi(string json)`, `static long ParsePageviews(string json)`.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public void ParseForecast_reads_daily_rain_and_temp()
{
    var json = "{\"daily\":{\"precipitation_sum\":[12.5],\"temperature_2m_max\":[31.0]}}";
    var (rain, temp) = CovariateTools.ParseForecast(json);
    Assert.Equal(12.5, rain);
    Assert.Equal(31.0, temp);
}

[Fact]
public void ParseAqi_reads_us_aqi_max()
{
    var json = "{\"hourly\":{\"us_aqi\":[38,42,51]}}";
    Assert.Equal(51, CovariateTools.ParseAqi(json));
}

[Fact]
public void ParsePageviews_sums_daily_views()
{
    var json = "{\"items\":[{\"views\":100},{\"views\":80}]}";
    Assert.Equal(180, CovariateTools.ParsePageviews(json));
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "CovariateParseTest" 2>&1`
Expected: FAIL (no `CovariateTools` type).

- [ ] **Step 3: Write minimal implementation**

```csharp
using System.Text.Json;

namespace HealthAlert.Tools;

public static class CovariateTools
{
    public static (double RainMm, double TempC) ParseForecast(string json)
    {
        using var d = JsonDocument.Parse(json);
        var daily = d.RootElement.GetProperty("daily");
        return (daily.GetProperty("precipitation_sum")[0].GetDouble(),
                daily.GetProperty("temperature_2m_max")[0].GetDouble());
    }

    public static int ParseAqi(string json)
    {
        using var d = JsonDocument.Parse(json);
        return d.RootElement.GetProperty("hourly").GetProperty("us_aqi")
            .EnumerateArray().Max(e => e.GetInt32());
    }

    public static long ParsePageviews(string json)
    {
        using var d = JsonDocument.Parse(json);
        return d.RootElement.GetProperty("items")
            .EnumerateArray().Sum(e => e.GetProperty("views").GetInt64());
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "CovariateParseTest" 2>&1`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools/CovariateTools.cs src/backend/HealthAlert.Tests/CovariateParseTest.cs
git commit -m "feat: keyless provider JSON parsers for covariates"
```

### Task 3: Daily pull on the ticker with upsert + failure tolerance

**Files:**
- Modify: `src/backend/HealthAlert.Tools/CovariateTools.cs` (add `CovariateFeedService`)
- Modify: `src/backend/HealthAlert.Api/Services/IngestTickerService.cs` (daily gate call)
- Modify: `src/backend/HealthAlert.Api/Program.cs` (register `HttpClient` + service)
- Test: `src/backend/HealthAlert.Tests/CovariateFeedTest.cs`

**Interfaces:**
- Consumes: `ParseForecast/ParseAqi/ParsePageviews` from Task 2, `HealthAlertDbContext`.
- Produces: `CovariateFeedService.RefreshDailyAsync(CancellationToken)`; upsert key is `(Place, Date, Source)`.

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public async Task Refresh_upserts_same_day_twice_as_one_row()
{
    var ctx = TestDb.Create();
    var svc = new CovariateFeedService(ctx, new HttpClient(new FakeRainHandler()));
    await svc.RefreshDailyAsync(CancellationToken.None);
    await svc.RefreshDailyAsync(CancellationToken.None);
    Assert.Equal(1, await ctx.CovariateReadings.CountAsync(c => c.Source == "open-meteo"));
}

[Fact]
public async Task Failed_pull_keeps_last_good_reading()
{
    var ctx = TestDb.Create();
    ctx.CovariateReadings.Add(new TblCovariateReading { Place = "Agoo", Date = DateTime.UtcNow.Date, Source = "open-meteo", Payload = "{}" });
    await ctx.SaveChangesAsync();
    var svc = new CovariateFeedService(ctx, new HttpClient(new ThrowHandler()));
    await svc.RefreshDailyAsync(CancellationToken.None);
    Assert.Equal(1, await ctx.CovariateReadings.CountAsync());
}
```

`FakeRainHandler`/`ThrowHandler` are 10-line `HttpMessageHandler` subclasses defined in the test file returning canned forecast JSON or throwing `HttpRequestException`.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "CovariateFeedTest" 2>&1`
Expected: FAIL (no `CovariateFeedService` type).

- [ ] **Step 3: Write minimal implementation**

```csharp
namespace HealthAlert.Tools;

public class CovariateFeedService(HealthAlertDbContext ctx, HttpClient http)
{
    public static readonly Dictionary<string, (double Lat, double Lng)> Places = new()
    {
        ["San Fernando City"] = (16.6159, 120.3209),
        ["Agoo"] = (16.3217, 120.3647),
        ["Bauang"] = (16.5244, 120.3314),
    };

    public async Task RefreshDailyAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        foreach (var (place, coord) in Places)
        {
            if (await ctx.CovariateReadings.AnyAsync(c => c.Place == place && c.Date == today && c.Source == "open-meteo", ct)) continue;
            try
            {
                var json = await http.GetStringAsync(
                    $"https://api.open-meteo.com/v1/forecast?latitude={coord.Lat}&longitude={coord.Lng}&daily=precipitation_sum,temperature_2m_max&timezone=Asia%2FManila", ct);
                var (rain, temp) = CovariateTools.ParseForecast(json);
                ctx.CovariateReadings.Add(new TblCovariateReading { Place = place, Date = today, Source = "open-meteo",
                    Payload = $"{{\"rainMm\":{rain},\"tempC\":{temp}}}" });
                await ctx.SaveChangesAsync(ct);
            }
            catch (HttpRequestException) { /* last good reading stands */ }
        }
    }
}
```

Wire-up in `IngestTickerService` (needs `IServiceProvider` scope; call on `tick % 24 == 0`) and `Program.cs` (`builder.Services.AddHttpClient<CovariateFeedService>();`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests --filter "CovariateFeedTest" 2>&1`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools src/backend/HealthAlert.Api src/backend/HealthAlert.Tests/CovariateFeedTest.cs
git commit -m "feat: daily keyless covariate pull with upsert and failure tolerance"
```
