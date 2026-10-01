# ML Forecast Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace heuristic outlooks with per-disease ridge regressors fitted in-backend on lagged cases + covariate lags, versioned behind a registry with walk-forward metrics.

**Architecture:** `RidgeRegression` static math (Gaussian-elimination solver, no new packages) fits weights; `ModelRegistryTools` trains per disease, stores coefficients + RMSE/MAE/R² in `tblForecastModels`, and serves the deployed version; `ForecastGetTools.OutlookAsync` prefers a fitted model, falls back to existing heuristics cold-start.

**Tech Stack:** .NET 10, EF Core, xUnit. No Python, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §3 (models part)

## Global Constraints

- Disease scope stays dengue/leptospirosis/ili/asthma.
- Retraining stages a challenger; challengers never silently replace deployed models.
- Existing heuristic estimators stay as cold-start fallbacks.
- Backend builds/tests run `-c Release` (dev server locks Debug outputs).
- TDD: failing test first for every task; commit per task.

---

### Task 1: Ridge solver + walk-forward metrics (pure math, no DB)

**Files:**
- Create: `src/backend/HealthAlert.Tools/RidgeRegression.cs`
- Test: `src/backend/HealthAlert.Tests/RidgeRegressionTest.cs`

**Interfaces:**
- Consumes: `double[][] X` (rows = weeks, first column must be 1.0 bias), `double[] y`.
- Produces: `static double[] Fit(double[][] X, double[] y, double lambda)`, `static (double Rmse, double Mae, double R2) WalkForward(double[][] X, double[] y, double lambda, int folds = 3)`.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public void Fit_recovers_linear_weights()
{
    var X = new[] { new[] { 1.0, 1.0 }, new[] { 1.0, 2.0 }, new[] { 1.0, 3.0 }, new[] { 1.0, 4.0 } };
    var y = new[] { 3.0, 5.0, 7.0, 9.0 };
    var w = RidgeRegression.Fit(X, y, 1e-6);
    Assert.Equal(1.0, w[0], precision: 3);
    Assert.Equal(2.0, w[1], precision: 3);
}

[Fact]
public void WalkForward_reports_finite_metrics()
{
    var X = Enumerable.Range(1, 12).Select(i => new[] { 1.0, (double)i }).ToArray();
    var y = X.Select(r => 2 * r[1] + 1).ToArray();
    var (rmse, mae, r2) = RidgeRegression.WalkForward(X, y, 0.1);
    Assert.True(double.IsFinite(rmse) && double.IsFinite(mae) && double.IsFinite(r2));
    Assert.True(r2 > 0.9);
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "RidgeRegressionTest" 2>&1`
Expected: FAIL (no `RidgeRegression` type).

- [ ] **Step 3: Write minimal implementation**

```csharp
namespace HealthAlert.Tools;

public static class RidgeRegression
{
    public static double[] Fit(double[][] X, double[] y, double lambda)
    {
        int n = X.Length, p = X[0].Length;
        var a = new double[p, p];
        var b = new double[p];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < p; j++)
            {
                b[j] += X[i][j] * y[i];
                for (int k = 0; k < p; k++) a[j, k] += X[i][j] * X[i][k];
            }
        for (int j = 1; j < p; j++) a[j, j] += lambda; // bias unpenalized
        return Solve(a, b, p);
    }

    public static (double Rmse, double Mae, double R2) WalkForward(double[][] X, double[] y, double lambda, int folds = 3)
    {
        var preds = new List<double>(); var actual = new List<double>();
        int cut = X.Length / (folds + 1);
        for (int f = 1; f <= folds; f++)
        {
            var w = Fit(X[..(cut * f)], y[..(cut * f)], lambda);
            for (int i = cut * f; i < Math.Min(cut * (f + 1), X.Length); i++)
            {
                preds.Add(Dot(w, X[i])); actual.Add(y[i]);
            }
        }
        double mae = preds.Zip(actual, (p, a) => Math.Abs(p - a)).Average();
        double rmse = Math.Sqrt(preds.Zip(actual, (p, a) => (p - a) * (p - a)).Average());
        double mean = actual.Average();
        double r2 = 1 - preds.Zip(actual, (p, a) => (p - a) * (p - a)).Sum() / actual.Sum(a => (a - mean) * (a - mean));
        return (rmse, mae, r2);
    }

    private static double Dot(double[] w, double[] x) => w.Zip(x, (a, b) => a * b).Sum();

    private static double[] Solve(double[,] a, double[] b, int p)
    {
        var m = (double[,])a.Clone(); var v = (double[])b.Clone();
        for (int c = 0; c < p; c++)
        {
            int piv = c;
            for (int r = c + 1; r < p; r++) if (Math.Abs(m[r, c]) > Math.Abs(m[piv, c])) piv = r;
            for (int k = 0; k < p; k++) (m[c, k], m[piv, k]) = (m[piv, k], m[c, k]);
            (v[c], v[piv]) = (v[piv], v[c]);
            for (int r = c + 1; r < p; r++)
            {
                double f = m[r, c] / m[c, c];
                for (int k = c; k < p; k++) m[r, k] -= f * m[c, k];
                v[r] -= f * v[c];
            }
        }
        var x = new double[p];
        for (int r = p - 1; r >= 0; r--)
        {
            double s = v[r];
            for (int k = r + 1; k < p; k++) s -= m[r, k] * x[k];
            x[r] = s / m[r, r];
        }
        return x;
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "RidgeRegressionTest" 2>&1`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools/RidgeRegression.cs src/backend/HealthAlert.Tests/RidgeRegressionTest.cs
git commit -m "feat: ridge solver with walk-forward metrics"
```

### Task 2: Model registry entity + training on case history

**Files:**
- Modify: `src/backend/HealthAlert.Database/HealthAlertDbContext.cs` (add `TblForecastModel`)
- Create: `src/backend/HealthAlert.Tools/ModelRegistryTools.cs`
- Test: `src/backend/HealthAlert.Tests/ModelRegistryTest.cs`

**Interfaces:**
- Consumes: `RidgeRegression` from Task 1, `TblCase` history, `TblCovariateReading` payloads.
- Produces: `TblForecastModel { Id, Disease, Version, CoeffsJson, TrainedFrom, TrainedTo, Rmse, Mae, R2, Status }`; `Task<TblForecastModel> TrainAsync(string disease)` (stages `Status="challenger"`); `Task<TblForecastModel?> DeployedAsync(string disease)`; `Task PromoteAsync(long id)` (challenger→deployed, old deployed→retired); `static double Predict(TblForecastModel m, double[] features)`.

Feature layout (documented in code, 8 wide): `[1.0 bias, casesLag1, casesLag2, rainLag2, rainLag4, tempLag1, aqiLag0, pageviewsMomentum]`. Missing covariate weeks contribute 0.0. `TrainAsync` throws `InvalidOperationException` when fewer than 12 case rows exist.

- [ ] **Step 1: Write the failing tests**

```csharp
private static void SeedCases(HealthAlertDbContext ctx, string disease, int weeks, Func<int, double> fn)
{
    var d = new TblDisease { Code = disease, Category = "test" };
    ctx.Diseases.Add(d); ctx.SaveChanges();
    var t0 = new DateTime(2026, 1, 5);
    for (int i = 0; i < weeks; i++)
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, Count = fn(i), ReportedAt = t0.AddDays(7 * i) });
    ctx.SaveChanges();
}

[Fact]
public async Task Train_stages_challenger_with_metrics()
{
    var ctx = TestDb.Create();
    SeedCases(ctx, "dengue", 20, i => 10 + i);
    var tools = new ModelRegistryTools(ctx);
    var m = await tools.TrainAsync("dengue");
    Assert.Equal("challenger", m.Status);
    Assert.True(m.R2 > 0.5);
    Assert.Null(await tools.DeployedAsync("dengue"));
}

[Fact]
public async Task Promote_retires_previous_deployed()
{
    var ctx = TestDb.Create();
    SeedCases(ctx, "dengue", 20, i => 10 + i);
    var tools = new ModelRegistryTools(ctx);
    var v1 = await tools.TrainAsync("dengue");
    await tools.PromoteAsync(v1.Id);
    var v2 = await tools.TrainAsync("dengue");
    await tools.PromoteAsync(v2.Id);
    Assert.Equal("retired", (await ctx.ForecastModels.FindAsync(v1.Id))!.Status);
    Assert.Equal(v2.Id, (await tools.DeployedAsync("dengue"))!.Id);
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "ModelRegistryTest" 2>&1`
Expected: FAIL (no `ForecastModels`/`ModelRegistryTools`).

- [ ] **Step 3: Write minimal implementation**

Entity (same one-line style as other entities):

```csharp
public class TblForecastModel { public long Id { get; set; } public string? Disease { get; set; } public int Version { get; set; } public string? CoeffsJson { get; set; } public DateTime? TrainedFrom { get; set; } public DateTime? TrainedTo { get; set; } public double? Rmse { get; set; } public double? Mae { get; set; } public double? R2 { get; set; } public string? Status { get; set; } }
```

DbSet + `m.Entity<TblForecastModel>().ToTable("tblForecastModels");`. Tools:

```csharp
using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class ModelRegistryTools(HealthAlertDbContext ctx)
{
    // features: [1 bias, casesLag1, casesLag2, rainLag2, rainLag4, tempLag1, aqiLag0, pageviewsMomentum]
    public async Task<TblForecastModel> TrainAsync(string disease)
    {
        var rows = await ctx.Cases.Include(c => c.DiseaseId)
            .Where(c => ctx.Diseases.Where(d => d.Code == disease).Select(d => d.Id).Contains(c.DiseaseId ?? -1))
            .OrderBy(c => c.ReportedAt).ToListAsync();
        if (rows.Count < 12) throw new InvalidOperationException($"insufficient history for {disease}");
        var counts = rows.Select(c => c.Count ?? 0).ToArray();
        var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
        double Rain(int back) => Cov(cov, rows.Count - 1 - back, "rainMm");
        double Temp(int back) => Cov(cov, rows.Count - 1 - back, "tempC");
        double Aqi() => Cov(cov, rows.Count - 1, "aqi");
        double Pv() => Cov(cov, rows.Count - 1, "pageviews") - Cov(cov, rows.Count - 2, "pageviews");
        var X = new List<double[]>(); var y = new List<double>();
        for (int i = 4; i < counts.Length; i++)
            X.Add([1, counts[i - 1], counts[i - 2], Rain(2), Rain(4), Temp(1), Aqi(), Pv()]);
        for (int i = 4; i < counts.Length; i++) y.Add(counts[i]);
        var w = RidgeRegression.Fit([.. X], [.. y], 1.0);
        var (rmse, mae, r2) = RidgeRegression.WalkForward([.. X], [.. y], 1.0);
        var ver = 1 + await ctx.ForecastModels.Where(m => m.Disease == disease).MaxAsync(m => (int?)m.Version) ?? 0;
        var m = new TblForecastModel { Disease = disease, Version = ver,
            CoeffsJson = JsonSerializer.Serialize(w),
            TrainedFrom = rows.First().ReportedAt, TrainedTo = rows.Last().ReportedAt,
            Rmse = rmse, Mae = mae, R2 = r2, Status = "challenger" };
        ctx.ForecastModels.Add(m);
        await ctx.SaveChangesAsync();
        return m;
    }

    public Task<TblForecastModel?> DeployedAsync(string disease) =>
        ctx.ForecastModels.Where(m => m.Disease == disease && m.Status == "deployed")
            .OrderByDescending(m => m.Version).FirstOrDefaultAsync();

    public async Task PromoteAsync(long id)
    {
        var m = await ctx.ForecastModels.FindAsync(id) ?? throw new InvalidOperationException("model not found");
        foreach (var old in ctx.ForecastModels.Where(x => x.Disease == m.Disease && x.Status == "deployed"))
            old.Status = "retired";
        m.Status = "deployed";
        await ctx.SaveChangesAsync();
    }

    public static double Predict(TblForecastModel m, double[] features)
    {
        var w = JsonSerializer.Deserialize<double[]>(m.CoeffsJson!)!;
        return Math.Max(0, w.Zip(features, (a, b) => a * b).Sum());
    }

    private static double Cov(List<TblCovariateReading> cov, int idx, string key)
    {
        if (idx < 0 || idx >= cov.Count) return 0;
        try
        {
            using var d = JsonDocument.Parse(cov[idx].Payload ?? "{}");
            return d.RootElement.TryGetProperty(key, out var v) ? v.GetDouble() : 0;
        }
        catch (JsonException) { return 0; }
    }

    private static long DiseaseId(string disease) =>
        ctx.Diseases.Where(d => d.Code == disease).Select(d => d.Id).FirstOrDefault();
}
```

Note: `DiseaseId` helper is unused by the query above (kept for the admin endpoint in Task 3) — delete it here to avoid dead code; Task 3 re-adds what it needs. Remove before committing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "ModelRegistryTest" 2>&1`
Expected: PASS (2/2). If R2 assertion fails on flat seeds, the ascending `10 + i` seed guarantees trend signal.

- [ ] **Step 5: Add migration + commit**

Run: `dotnet ef migrations add AddForecastModels --project src/backend/HealthAlert.Database --startup-project src/backend/HealthAlert.Api 2>&1`

```bash
git add src/backend/HealthAlert.Database src/backend/HealthAlert.Tools/ModelRegistryTools.cs src/backend/HealthAlert.Tests/ModelRegistryTest.cs
git commit -m "feat: versioned model registry with ridge training"
```

### Task 3: Serve deployed models from outlook + admin train/promote endpoints

**Files:**
- Modify: `src/backend/HealthAlert.Tools/ForecastGetTools.cs` (`OutlookAsync` prefers deployed model)
- Modify: `src/backend/HealthAlert.Api/Controllers/ForecastController.cs` (add `POST train`, `POST promote/{id}`, both `Authorize`)
- Modify: `src/backend/HealthAlert.Api/Program.cs` (register `ModelRegistryTools`)
- Test: `src/backend/HealthAlert.Tests/ModelServeTest.cs`

**Interfaces:**
- Consumes: `ModelRegistryTools.DeployedAsync/Predict` from Task 2.
- Produces: outlook probability from model when deployed, heuristic otherwise; endpoints return `ApiResponse.Ok`.

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public async Task Outlook_uses_deployed_model_when_present()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var counts = new double[] { 10, 12, 11, 13, 15, 14, 16, 18, 17, 19, 21, 20, 22, 24 };
    var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
    var t0 = new DateTime(2026, 1, 5);
    for (int i = 0; i < counts.Length; i++)
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, Count = counts[i], ReportedAt = t0.AddDays(7 * i) });
    await ctx.SaveChangesAsync();
    var reg = new ModelRegistryTools(ctx);
    await reg.PromoteAsync((await reg.TrainAsync("dengue")).Id);
    var o = await new ForecastGetTools(ctx).OutlookAsync("dengue", "Agoo");
    Assert.True(o.Probability > 0 && o.Probability <= 0.97);
    Assert.Contains("fitted-model", o.Drivers);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "ModelServeTest" 2>&1`
Expected: FAIL (no `fitted-model` driver).

- [ ] **Step 3: Write minimal implementation**

In `ForecastGetTools`, inject `ModelRegistryTools` and branch:

```csharp
public class ForecastGetTools(HealthAlertDbContext ctx, ModelRegistryTools reg)
{
    public async Task<ForecastOutlook> OutlookAsync(string? disease, string? muni)
    {
        var o = Build(disease);
        var n = await ctx.Cases.CountAsync();
        var m = disease is null ? null : await reg.DeployedAsync(disease);
        if (m is not null)
        {
            var feat = await LatestFeaturesAsync(disease);
            var cases = Math.Max(1, await ctx.Cases.CountAsync());
            var prob = Math.Min(0.97, ModelRegistryTools.Predict(m, feat) / 50);
            return o with { Probability = prob, Muni = muni, Drivers = ["fitted-model", ..o.Drivers.Take(2)] };
        }
        return o with { Probability = Math.Min(0.97, o.Probability + n * 0.01), Muni = muni };
    }
    // LatestFeaturesAsync mirrors TrainAsync feature layout using the most recent week
}
```

`LatestFeaturesAsync` builds the same 8-wide vector from the newest case row + covariate readings. Controller adds:

```csharp
[HttpPost("train")]
public async Task<IActionResult> Train([FromBody] ForecastReq r, [FromServices] ModelRegistryTools reg) =>
    Ok(ApiResponse.Ok(await reg.TrainAsync(r.Disease ?? "dengue")));

[HttpPost("promote/{id:long}")]
public async Task<IActionResult> Promote(long id, [FromServices] ModelRegistryTools reg)
{
    await reg.PromoteAsync(id);
    return Ok(ApiResponse.Ok(new { promoted = id }));
}
```

Register `ModelRegistryTools` as scoped in `Program.cs`. Note: existing `ForecastController` constructor takes `(IConfiguration cfg, IHostEnvironment env)` with `[FromServices]` params per action — follow that exact pattern.

- [ ] **Step 4: Run tests (new + full suite) to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: PASS, total grows by 1, zero regressions.

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools/ForecastGetTools.cs src/backend/HealthAlert.Api/Controllers/ForecastController.cs src/backend/HealthAlert.Api/Program.cs src/backend/HealthAlert.Tests/ModelServeTest.cs
git commit -m "feat: serve deployed models from outlook with train/promote endpoints"
```
