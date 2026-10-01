# Risk Bands + Dynamic Hotspots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** High/Watch/Routine bands from stored per-disease threshold documents, and hotspots computed from live cases + model outputs instead of the hard-coded registry.

**Architecture:** `tblRiskThresholds` holds tunable bands (probability cutoffs, velocity multipliers, Breteau-style covariate limits); `RiskBandTools.Assign` returns max severity across signals; `RiskMapsGetTools` builds hotspot rows from `tblCases` aggregates + fitted-model probabilities + thresholds, cached 1 hour in memory.

**Tech Stack:** .NET 10, EF Core, xUnit, IMemoryCache (already referenced via ASP.NET Core shared framework).

**Spec:** `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §3 (bands + hotspots part)

## Global Constraints

- Band = max severity across probability, case-velocity, and covariate-threshold signals.
- Thresholds stored as data, tunable without code changes.
- Hotspot API shape unchanged (Risk Maps + Dashboard keep working).
- Backend builds/tests run `-c Release` (dev server locks Debug outputs).
- TDD: failing test first for every task; commit per task.

---

### Task 1: Threshold documents + band assignment

**Files:**
- Modify: `src/backend/HealthAlert.Database/HealthAlertDbContext.cs` (add `TblRiskThreshold`)
- Create: `src/backend/HealthAlert.Tools/RiskBandTools.cs`
- Test: `src/backend/HealthAlert.Tests/RiskBandTest.cs`

**Interfaces:**
- Consumes: `TblRiskThreshold { Id, Disease, HighProb, WatchProb, VelocityHigh, VelocityWatch, CovariateKey, CovariateHigh }`.
- Produces: `static string Assign(double prob, double velocity, double covariate, TblRiskThreshold t)` returning `"high"`, `"moderate"`, or `"low"`; `static TblRiskThreshold DefaultFor(string disease)`.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public void High_probability_wins_over_quiet_covariates()
{
    var t = RiskBandTools.DefaultFor("dengue");
    Assert.Equal("high", RiskBandTools.Assign(0.85, 1.0, 5.0, t));
}

[Fact]
public void Breteau_over_threshold_forces_high()
{
    var t = RiskBandTools.DefaultFor("dengue");
    Assert.Equal("high", RiskBandTools.Assign(0.1, 1.0, 24.5, t));
}

[Fact]
public void Quiet_signals_stay_routine()
{
    var t = RiskBandTools.DefaultFor("dengue");
    Assert.Equal("low", RiskBandTools.Assign(0.1, 1.0, 5.0, t));
}

[Fact]
public void Seed_writes_default_thresholds()
{
    var ctx = TestDb.Create();
    Seed.RunAsync(ctx).GetAwaiter().GetResult();
    Assert.True(ctx.RiskThresholds.Any(t => t.Disease == "dengue"));
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "RiskBandTest" 2>&1`
Expected: FAIL (no `RiskThresholds`/`RiskBandTools`).

- [ ] **Step 3: Write minimal implementation**

```csharp
public class TblRiskThreshold { public long Id { get; set; } public string? Disease { get; set; } public double HighProb { get; set; } public double WatchProb { get; set; } public double VelocityHigh { get; set; } public double VelocityWatch { get; set; } public string? CovariateKey { get; set; } public double CovariateHigh { get; set; } }
```

DbSet + table mapping. Tools:

```csharp
namespace HealthAlert.Tools;

using HealthAlert.Database;

public static class RiskBandTools
{
    public static TblRiskThreshold DefaultFor(string disease) => disease switch
    {
        "leptospirosis" => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "rainMm", CovariateHigh = 150 },
        "ili" => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "pageviews", CovariateHigh = 800 },
        "asthma" => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "aqi", CovariateHigh = 100 },
        _ => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "breteau", CovariateHigh = 20 },
    };

    public static string Assign(double prob, double velocity, double covariate, TblRiskThreshold t)
    {
        if (prob >= t.HighProb || velocity >= t.VelocityHigh || covariate >= t.CovariateHigh) return "high";
        if (prob >= t.WatchProb || velocity >= t.VelocityWatch) return "moderate";
        return "low";
    }
}
```

Seed: for each of the 4 disease codes, `if (!RiskThresholds.Any(disease)) add DefaultFor(disease)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "RiskBandTest" 2>&1`
Expected: PASS (4/4).

- [ ] **Step 5: Add migration + commit**

Run: `dotnet ef migrations add AddRiskThresholds --project src/backend/HealthAlert.Database --startup-project src/backend/HealthAlert.Api 2>&1`

```bash
git add src/backend/HealthAlert.Database src/backend/HealthAlert.Tools/RiskBandTools.cs src/backend/HealthAlert.Tests/RiskBandTest.cs
git commit -m "feat: threshold documents with max-severity band assignment"
```

### Task 2: Computed hotspots replace the static registry

**Files:**
- Modify: `src/backend/HealthAlert.Tools/RiskMapsGetTools.cs` (compute from cases + models + thresholds; keep return shape)
- Test: `src/backend/HealthAlert.Tests/DynamicHotspotTest.cs`

**Interfaces:**
- Consumes: `TblCase` aggregates per (muni, disease), `ModelRegistryTools.DeployedAsync`, `RiskBandTools.Assign`, `tblRiskThresholds`.
- Produces: same anonymous hotspot shape the controller already returns (`id`, `muni`, `province`, `disease`, `diseaseName`, `level`, `lat`, `lng`, `cases`, `probability`); `IMemoryCache` 1-hour entries keyed `"hotspots"`.

Current file returns a hard-coded list; read it first (fields listed in the repo grep: ncr-qc-batasan entries with lat/lng). Keep a static coordinate table for known municipalities (reuse `CovariateFeedService.Places` plus existing lat/lng pairs) and compute `level`/`cases`/`probability` live. Places with no cases in the last 28 days drop out; probability comes from the deployed model when present, else the existing heuristic `OutlookAsync`.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task Surging_cases_produce_high_hotspot()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
    var t0 = DateTime.UtcNow.Date;
    for (int i = 0; i < 4; i++)
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = $"s{i}", Count = 5 + i * 10, ReportedAt = t0.AddDays(-7 * (3 - i)) });
    await ctx.SaveChangesAsync();
    var spots = await new RiskMapsGetTools(ctx, new ModelRegistryTools(ctx)).HotspotsAsync();
    var ago = spots.FirstOrDefault(s => s.Muni.Contains("Agoo"));
    Assert.NotNull(ago);
    Assert.Equal("high", ago.Level);
}

[Fact]
public async Task Quiet_places_drop_out()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var spots = await new RiskMapsGetTools(ctx, new ModelRegistryTools(ctx)).HotspotsAsync();
    Assert.Empty(spots);
}
```

Hotspot rows need a `Muni` field containing the municipality name and a `Level` field — match whatever record/anonymous shape the current tools return (executor: read `RiskMapsGetTools.cs` first; adjust property access accordingly, keep the test intent).

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "DynamicHotspotTest" 2>&1`
Expected: FAIL (static registry returns fixed rows regardless of cases).

- [ ] **Step 3: Write minimal implementation**

Rewrite `HotspotsAsync` (keep method name/signature the controller calls):

```csharp
public async Task<List<HotspotRow>> HotspotsAsync()
{
    if (mem.TryGetValue("hotspots", out List<HotspotRow>? cached) && cached is not null) return cached;
    var since = DateTime.UtcNow.AddDays(-28);
    var groups = await ctx.Cases.Where(c => c.ReportedAt >= since)
        .GroupBy(c => new { c.DiseaseId, Muni = c.SourceKey!.Split('|')[0] })
        .Select(g => new { g.Key.DiseaseId, g.Key.Muni, Total = g.Sum(c => c.Count ?? 0), Last = g.OrderByDescending(c => c.ReportedAt).First().Count ?? 0, Prev = g.OrderByDescending(c => c.ReportedAt).Skip(1).FirstOrDefault()!.Count ?? 0 })
        .ToListAsync();
    // ... per group: disease code lookup, model probability or heuristic fallback,
    // threshold lookup (db row or RiskBandTools.DefaultFor), Assign, coordinate lookup,
    // mem.Set("hotspots", rows, TimeSpan.FromHours(1)); return rows;
}
```

Case rows must carry municipality: convention is `SourceKey = "muni|uniquekey"` (document in code; ingest already writes SourceKey). Velocity = Last / max(1, Prev).

- [ ] **Step 4: Run tests (new + full suite) to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: PASS with zero regressions. Existing `HttpSmokeTest` may assert specific static hotspot rows — if it does, update those assertions to seed cases first (minimal edit, same intent).

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools/RiskMapsGetTools.cs src/backend/HealthAlert.Tests/DynamicHotspotTest.cs
git commit -m "feat: hotspots computed from live cases and models"
```
