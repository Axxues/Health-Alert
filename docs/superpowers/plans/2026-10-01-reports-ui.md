# Reports UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Weekly PIDSR-style bulletin generator with print/export plus custom CSV exports, served by real backend queries.

**Architecture:** `ReportsGetTools` gains real queries over cases/forecasts/alerts (replacing the hard-coded sample); new `features/reports` page with Bulletin tab (generated from live data, print stylesheet) and Custom tab (filters → CSV download built client-side from API rows).

**Tech Stack:** .NET 10, EF Core, xUnit, React + Tailwind, `window.print()` for bulletin export (no PDF library).

**Spec:** `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §4 (reports part)

## Global Constraints

- Bulletin content: cases, trends, hotspots, forecasts, active alerts — all from live queries.
- No PDF library; bulletin exports via print stylesheet, custom exports via client-built CSV.
- Frontend follows `services/rag/api/rag.api.ts` + `httpClient` pattern.
- Backend builds/tests run `-c Release`; frontend `npx tsc --noEmit -p tsconfig.json`.
- TDD: failing test first for every task; commit per task.

---

### Task 1: Real report queries replace the hard-coded sample

**Files:**
- Modify: `src/backend/HealthAlert.Tools/ReportsGetTools.cs`
- Test: `src/backend/HealthAlert.Tests/ReportsQueryTest.cs`

**Interfaces:**
- Consumes: `TblCase`, `TblForecastRun`/`ForecastGetTools`, `TblAlert`.
- Produces: `Task<WeeklyBulletin> BulletinAsync(DateTime weekStart)` with `WeeklyBulletin` record `(string Week, List<DiseaseRow> Diseases, List<string> Hotspots, List<string> ActiveAlerts)` where `DiseaseRow` is `(string Disease, double Cases, double PrevCases, double ChangePct)`; `Task<List<CaseExportRow>> ExportAsync(string? muni, string? disease, DateTime from, DateTime to)` with `CaseExportRow` `(DateTime Date, string Muni, string Disease, double Count)`.

Case rows carry municipality via the `SourceKey = "muni|uniquekey"` convention (established in the hotspots plan); executor: parse the muni prefix, skip rows without the separator.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task Bulletin_sums_two_weeks_per_disease()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
    var monday = new DateTime(2026, 9, 28);
    ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|a1", Count = 10, ReportedAt = monday });
    ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|a2", Count = 6, ReportedAt = monday.AddDays(-7) });
    await ctx.SaveChangesAsync();
    var b = await new ReportsGetTools(ctx).BulletinAsync(monday);
    var row = b.Diseases.First(r => r.Disease == "dengue");
    Assert.Equal(10, row.Cases);
    Assert.Equal(6, row.PrevCases);
}

[Fact]
public async Task Export_filters_by_place_and_range()
{
    var ctx = TestDb.Create();
    await Seed.RunAsync(ctx);
    var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
    ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|a1", Count = 4, ReportedAt = new DateTime(2026, 9, 28) });
    ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Bauang|b1", Count = 9, ReportedAt = new DateTime(2026, 9, 28) });
    await ctx.SaveChangesAsync();
    var rows = await new ReportsGetTools(ctx).ExportAsync("Agoo", "dengue", new DateTime(2026, 9, 21), new DateTime(2026, 10, 5));
    Assert.Single(rows);
    Assert.Equal("Agoo", rows[0].Muni);
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "ReportsQueryTest" 2>&1`
Expected: FAIL (no such methods; current `Surveillance()` returns an anonymous hard-coded object).

- [ ] **Step 3: Write minimal implementation**

```csharp
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record DiseaseRow(string Disease, double Cases, double PrevCases, double ChangePct);
public record WeeklyBulletin(string Week, List<DiseaseRow> Diseases, List<string> Hotspots, List<string> ActiveAlerts);
public record CaseExportRow(DateTime Date, string Muni, string Disease, double Count);

public class ReportsGetTools(HealthAlertDbContext ctx)
{
    public async Task<WeeklyBulletin> BulletinAsync(DateTime weekStart)
    {
        var weekEnd = weekStart.AddDays(7);
        var prevStart = weekStart.AddDays(-7);
        var codes = await ctx.Diseases.Select(d => new { d.Id, d.Code }).ToListAsync();
        var rows = new List<DiseaseRow>();
        foreach (var c in codes)
        {
            double cur = await ctx.Cases.Where(x => x.DiseaseId == c.Id && x.ReportedAt >= weekStart && x.ReportedAt < weekEnd).SumAsync(x => x.Count ?? 0);
            double prev = await ctx.Cases.Where(x => x.DiseaseId == c.Id && x.ReportedAt >= prevStart && x.ReportedAt < weekStart).SumAsync(x => x.Count ?? 0);
            rows.Add(new(c.Code ?? "", cur, prev, prev == 0 ? 0 : (cur - prev) / prev * 100));
        }
        var hotspots = await ctx.Alerts.Where(a => a.Status == "new" || a.Status == "acked")
            .Select(a => (a.Muni ?? "") + " (" + (a.Disease ?? "") + ")").Distinct().ToListAsync();
        var alerts = await ctx.Alerts.Where(a => a.Status == "new").Select(a => a.Message ?? "").ToListAsync();
        return new WeeklyBulletin(weekStart.ToString("yyyy-MM-dd"), rows, hotspots, alerts);
    }

    public async Task<List<CaseExportRow>> ExportAsync(string? muni, string? disease, DateTime from, DateTime to)
    {
        var q = ctx.Cases.Where(c => c.ReportedAt >= from && c.ReportedAt < to);
        var rows = await q.OrderBy(c => c.ReportedAt).ToListAsync();
        var codes = await ctx.Diseases.ToDictionaryAsync(d => d.Id, d => d.Code ?? "");
        return rows.Select(c => new CaseExportRow(c.ReportedAt ?? DateTime.MinValue, MuniOf(c.SourceKey), codes.GetValueOrDefault(c.DiseaseId ?? -1, ""), c.Count ?? 0))
            .Where(r => (muni == null || r.Muni == muni) && (disease == null || r.Disease == disease || disease == "all"))
            .ToList();
    }

    private static string MuniOf(string? sourceKey) =>
        sourceKey != null && sourceKey.Contains('|') ? sourceKey.Split('|')[0] : "";
}
```

Keep the old `Surveillance()` method untouched (other callers may use it; executor: grep and remove only if unused).

- [ ] **Step 4: Run tests (new + full suite) to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: PASS with zero regressions.

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools/ReportsGetTools.cs src/backend/HealthAlert.Tests/ReportsQueryTest.cs
git commit -m "feat: live bulletin and export queries for reports"
```

### Task 2: Reports page (bulletin + custom CSV)

**Files:**
- Create: `src/frontend/src/services/reports/api/reports.api.ts`, `src/frontend/src/services/reports/types/reports.types.ts` (+ `index.ts` barrels)
- Create: `src/frontend/src/features/reports/pages/Reports.tsx`
- Modify: router (add `/reports` route), menu (add Reports entry)

**Interfaces:**
- Consumes: `GET /api/reports/bulletin?week=YYYY-MM-DD` → `WeeklyBulletin`; `GET /api/reports/export?...` → `CaseExportRow[]`. Executor: add these two GET actions to `ReportsController` first (thin, same `ApiResponse.Ok` pattern) — include in this task, tested via existing controller patterns (no new backend test required beyond Task 1 queries).
- Produces: Bulletin tab (week picker defaulting to current Monday, printable bulletin layout, Print button calling `window.print()`), Custom tab (muni/disease/date filters, Download CSV button building the file client-side with `Blob` + `URL.createObjectURL`).

- [ ] **Step 1: Write the failing test (service shape)**

Create `src/frontend/src/services/reports/api/reports.api.test.ts` following the alerts service test pattern (mock `httpClient`, assert `bulletin()` resolves). Implementation exports `bulletin(week: string)` and `exportRows(filters)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/frontend/src/services/reports 2>&1` from `src/frontend`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

Service files first, then controller GETs, then the page: bulletin layout is a clean document (title, week, disease table with cases/prev/change, hotspot list, active alerts, footer with generation timestamp); wrap printable area in a `print-area` class and add `@media print { body * hidden except .print-area }` — executor: check `index.css` for an existing print pattern first and follow it, else add the minimal block. Custom tab reuses the Intelligence filter-row style (search-free: muni select, disease select, from/to date inputs).

- [ ] **Step 4: Run typecheck + tests to verify they pass**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1` and `npx vitest run src/frontend/src/services/reports 2>&1` from `src/frontend`, plus `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/services/reports src/frontend/src/features/reports src/frontend/src/app/router.tsx src/frontend/src/constants/layout/menu/menu.tsx src/frontend/src/index.css src/backend/HealthAlert.Api/Controllers/ReportsController.cs
git commit -m "feat: reports page with printable bulletin and CSV export"
```
