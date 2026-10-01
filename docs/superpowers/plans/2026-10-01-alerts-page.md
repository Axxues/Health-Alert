# Alerts Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unified alert ledger — auto-generated alerts on entry to High (auto-resolved on downgrade, deduplicated) plus manual broadcasts — with a frontend Alerts page.

**Architecture:** `AlertEngineTools.EvaluateAsync` runs on the ticker after hotspot computation; writes/resolves `tblAlerts` rows (new columns: Kind auto/manual, Muni, Disease, PlaybookCode). Broadcast composer writes manual rows + outbox entries. New `features/alerts` page lists, filters, acknowledges, and (admin) composes.

**Tech Stack:** .NET 10, EF Core, xUnit, React + Tailwind, axios `httpClient` service pattern.

**Spec:** `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §4 (alerts part)

## Global Constraints

- One sustained outbreak = one alert (deduplicated), not daily spam.
- Broadcast right is admin-only (backend `Authorize(Roles=...)` or permission check matching existing `Permissions` pattern).
- Frontend follows `services/rag/api/rag.api.ts` + `httpClient` pattern and the Intelligence ledger table style.
- Backend builds/tests run `-c Release`; frontend `npx tsc --noEmit -p tsconfig.json`.
- TDD: failing test first for every task; commit per task.

---

### Task 1: Alert auto-generation with dedup lifecycle

**Files:**
- Modify: `src/backend/HealthAlert.Database/HealthAlertDbContext.cs` (extend `TblAlert`: `Kind`, `Muni`, `Disease`, `PlaybookCode`)
- Create: `src/backend/HealthAlert.Tools/AlertEngineTools.cs`
- Test: `src/backend/HealthAlert.Tests/AlertEngineTest.cs`

**Interfaces:**
- Consumes: hotspot rows (muni, disease, level) — accept `List<(string Muni, string Disease, string Level)>` so the engine stays UI-agnostic.
- Produces: `Task<AlertReport> EvaluateAsync(List<(string Muni, string Disease, string Level)> hotspots)` where `AlertReport` is a record `(int Opened, int Resolved)`; resolve sets `Status="resolved"`.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task First_high_opens_one_alert()
{
    var ctx = TestDb.Create();
    var rep = await new AlertEngineTools(ctx).EvaluateAsync([("Agoo", "dengue", "high")]);
    Assert.Equal(1, rep.Opened);
    Assert.Equal(1, await ctx.Alerts.CountAsync(a => a.Status == "new"));
}

[Fact]
public async Task Sustained_high_does_not_duplicate()
{
    var ctx = TestDb.Create();
    var eng = new AlertEngineTools(ctx);
    await eng.EvaluateAsync([("Agoo", "dengue", "high")]);
    var rep = await eng.EvaluateAsync([("Agoo", "dengue", "high")]);
    Assert.Equal(0, rep.Opened);
    Assert.Equal(1, await ctx.Alerts.CountAsync(a => a.Status == "new"));
}

[Fact]
public async Task Downgrade_resolves_open_alert()
{
    var ctx = TestDb.Create();
    var eng = new AlertEngineTools(ctx);
    await eng.EvaluateAsync([("Agoo", "dengue", "high")]);
    var rep = await eng.EvaluateAsync([("Agoo", "dengue", "moderate")]);
    Assert.Equal(1, rep.Resolved);
    Assert.Equal(0, await ctx.Alerts.CountAsync(a => a.Status == "new"));
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "AlertEngineTest" 2>&1`
Expected: FAIL (no `AlertEngineTools`).

- [ ] **Step 3: Write minimal implementation**

```csharp
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record AlertReport(int Opened, int Resolved);

public class AlertEngineTools(HealthAlertDbContext ctx)
{
    public async Task<AlertReport> EvaluateAsync(List<(string Muni, string Disease, string Level)> hotspots)
    {
        int opened = 0, resolved = 0;
        var highs = hotspots.Where(h => h.Level == "high").ToList();
        foreach (var h in highs)
        {
            bool open = await ctx.Alerts.AnyAsync(a => a.Muni == h.Muni && a.Disease == h.Disease && a.Kind == "auto" && (a.Status == "new" || a.Status == "acked"));
            if (open) continue;
            ctx.Alerts.Add(new TblAlert { Kind = "auto", Muni = h.Muni, Disease = h.Disease, Status = "new",
                Message = $"{h.Disease} entered High risk in {h.Muni}" });
            opened++;
        }
        var keys = highs.Select(h => h.Muni + "|" + h.Disease).ToHashSet();
        foreach (var a in await ctx.Alerts.Where(a => a.Kind == "auto" && a.Status != "resolved").ToListAsync())
        {
            if (!keys.Contains(a.Muni + "|" + a.Disease)) { a.Status = "resolved"; resolved++; }
        }
        await ctx.SaveChangesAsync();
        return new AlertReport(opened, resolved);
    }
}
```

Add the four columns to `TblAlert`, and hook `EvaluateAsync` into the ticker after hotspot computation (same scoped pattern as the covariate refresh in `IngestTickerService`).

- [ ] **Step 4: Run tests (new + full suite) to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: PASS with zero regressions.

- [ ] **Step 5: Add migration + commit**

Run: `dotnet ef migrations add ExtendAlerts --project src/backend/HealthAlert.Database --startup-project src/backend/HealthAlert.Api 2>&1`

```bash
git add src/backend/HealthAlert.Database src/backend/HealthAlert.Tools/AlertEngineTools.cs src/backend/HealthAlert.Api/Services/IngestTickerService.cs src/backend/HealthAlert.Tests/AlertEngineTest.cs
git commit -m "feat: threshold alert engine with dedup lifecycle"
```

### Task 2: Broadcast composer endpoint (admin-only) + outbox write

**Files:**
- Modify: `src/backend/HealthAlert.Tools/AlertsEditTools.cs` (add `BroadcastAsync`)
- Modify: `src/backend/HealthAlert.Api/Controllers/AlertsController.cs` (add `POST broadcast`)
- Test: `src/backend/HealthAlert.Tests/AlertBroadcastTest.cs`

**Interfaces:**
- Consumes: `TblAlert` extensions + `TblOutbox` from Task 1.
- Produces: `Task<TblAlert> BroadcastAsync(string muni, string message, string? playbookCode)`; endpoint returns `ApiResponse.Ok(alert)` or 403 for non-admins.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task Broadcast_writes_alert_and_outbox()
{
    var ctx = TestDb.Create();
    var a = await new AlertsEditTools(ctx).BroadcastAsync("Agoo", "Fever lane open", "SOP-CLN-04");
    Assert.Equal("manual", a.Kind);
    Assert.Equal("new", a.Status);
    Assert.Equal(1, await ctx.Outbox.CountAsync());
}

[Fact]
public async Task Broadcast_endpoint_rejects_viewer()
{
    var ctx = TestDb.Create();
    var c = new AlertsController(new AlertsGetTools(ctx), new AlertsEditTools(ctx), TestCfg.Config(), TestCfg.Env());
    // executor: set ControllerContext.HttpContext.User to a Viewer principal first
    var r = await c.Broadcast(new BroadcastReq("Agoo", "msg", null));
    Assert.IsType<ForbidResult>(r);
}
```

`BroadcastReq` is `public record BroadcastReq(string Muni, string Message, string? PlaybookCode)` in the controller file. Executor: check how existing tests build principals — follow `HttpSmokeTest`/`TestCfg` patterns; if no principal helper exists, construct `ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, "Viewer")]))` inline.

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "AlertBroadcastTest" 2>&1`
Expected: FAIL (no `BroadcastAsync`/`Broadcast`).

- [ ] **Step 3: Write minimal implementation**

```csharp
public async Task<TblAlert> BroadcastAsync(string muni, string message, string? playbookCode)
{
    var a = new TblAlert { Kind = "manual", Muni = muni, Message = message, PlaybookCode = playbookCode, Status = "new" };
    ctx.Alerts.Add(a);
    ctx.Outbox.Add(new TblOutbox { IdempotencyKey = $"broadcast-{Guid.NewGuid()}", Payload = message });
    await ctx.SaveChangesAsync();
    return a;
}
```

Controller endpoint with role gate matching the repo's existing auth style (`[Authorize]` + explicit role check returning `Forbid()` for Viewer; Admin passes). Roles are exactly `Admin` and `Viewer`.

- [ ] **Step 4: Run tests (new + full suite) to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: PASS with zero regressions.

- [ ] **Step 5: Commit**

```bash
git add src/backend/HealthAlert.Tools/AlertsEditTools.cs src/backend/HealthAlert.Api/Controllers/AlertsController.cs src/backend/HealthAlert.Tests/AlertBroadcastTest.cs
git commit -m "feat: admin-only alert broadcast with outbox write"
```

### Task 3: Alerts page (ledger + filters + ack + composer)

**Files:**
- Create: `src/frontend/src/services/alerts/api/alerts.api.ts`, `src/frontend/src/services/alerts/types/alerts.types.ts` (+ `index.ts` barrels matching rag service layout)
- Create: `src/frontend/src/features/alerts/pages/Alerts.tsx`
- Modify: router (add `/alerts` route), menu (add Alerts entry)

**Interfaces:**
- Consumes: `GET /api/alerts` → `Alert[] { id, kind, muni, disease, message, status, playbookCode }`; `POST /api/alerts/{id}/ack`; `POST /api/alerts/broadcast { muni, message, playbookCode }`.
- Produces: filterable ledger (All/Auto/Manual + status), ack buttons, admin-only composer form.

- [ ] **Step 1: Write the failing test (service shape)**

Create `src/frontend/src/services/alerts/api/alerts.api.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { listAlerts } from "./alerts.api";
import { api } from "@/services/core/client";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn().mockResolvedValue({ data: [] }),
  getSessionParams: () => ({}),
}));

describe("alerts api", () => {
  it("lists alerts", async () => {
    await expect(listAlerts()).resolves.toEqual([]);
  });
});
```

Implementation exports `listAlerts`, `ackAlert(id)`, `broadcastAlert(req)` via `httpClient` exactly like `rag.api.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/frontend/src/services/alerts/api/alerts.api.test.ts 2>&1` from `src/frontend`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

Service files first (test goes green), then the page: reuse the Intelligence ledger table style — header sentence with counts, kind/status filter selects, rows showing kind chip, place, disease, message, status, and ack button per open row; composer card (muni select from a static Region I list, message textarea, SOP code input, send button) rendered only when the session role is Admin (follow `getRole()` from `@/utils/auth` as used in `Layout.tsx`).

- [ ] **Step 4: Run typecheck + tests to verify they pass**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1` and `npx vitest run src/frontend/src/services/alerts 2>&1` from `src/frontend`
Expected: clean typecheck, tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/services/alerts src/frontend/src/features/alerts src/frontend/src/app/router.tsx src/frontend/src/constants/layout/menu/menu.tsx
git commit -m "feat: alerts ledger page with admin broadcast composer"
```
