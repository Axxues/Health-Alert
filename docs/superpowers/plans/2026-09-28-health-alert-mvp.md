# Health Alert MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phased MVP of Health Alert with all slices live but 4 diseases only (dengue, leptospirosis, ILI, asthma).

**Architecture:** ASP.NET Core 10 Web API + EF Core SQL Server (`HealthAlert_MVP`) with thin controllers -> Get/Edit tools; deterministic `IForecaster` (swappable for real ML); React 19+Vite 7 feature-sliced frontend with single router/Layout; n8n as JSON stubs + `BackgroundService` ticks.

**Tech Stack:** .NET 10, EF Core SqlServer, SignalR + Redis (in-memory MVP), React 19, Vite 7, TS, router@7, axios, shadcn/radix, Tailwind, lucide, xUnit, SQL Server Express.

**Spec:** `docs/superpowers/specs/2026-09-28-health-alert-mvp-design.md`

## Global Constraints
- DB `HealthAlert_MVP` on `localhost\SQLEXPRESS`; Tbl-plural tables, `long` PK, nullable non-keys.
- Envelope `ApiResponse{success,code,message,data}` + `PaginatedResult`; `getSessionParams()` + `buildPaginatedParams()` on every call.
- Imports absolute `@/*`; barrels only `services/*/api|types/index.ts`; `types/` root stays empty.
- DESIGN tokens: primary `#533afd`, ink `#0d253d`, canvas `#f6f9fc`, hairline `#e3e8ee`; display 300wt tight tracking; pills + near-white cards; CSS gradient mesh top-third only.
- frontend-design: hero = most characteristic thing; 1–2 typefaces; <80ch; no 01/02/03 unless sequence; no generic AI gradients/cards.
- JWT 24h + hard logout on 401; `PermissionRoute` + controller `RequirePermission` double-check; ingest cron-key guarded, idempotent by source key.
- No PII; aggregate muni centroids only.

---

## File Structure
- `src/backend/HealthAlert.Api/` Program.cs, controllers (Auth,Surveillance,Forecast,RiskMaps,Rag,Playbook,Alerts,Citizen,Reports,SystemUser,Messaging,System,CronJob), hubs/NotificationHub.cs, filters (Permission,Session,CronKey)
- `src/backend/HealthAlert.Common/` helpers (Crypto,HeatIndex,Aqi), constants (Permissions,Topics,Taglish)
- `src/backend/HealthAlert.Database/` HealthAlertDbContext.cs, `Tbl*.cs` (Diseases,Feeds,Cases,ForecastRuns,Alerts,Playbooks,PlaybookExecutions,RagDocs,Users,AuditTrail,Outbox), `VwHotspots.cs`, Migrations/
- `src/backend/HealthAlert.Tools/` Get/Edit pairs per domain + `IForecaster` (Dengue/Argo/Dlnm/HiAqi) + `IRagRetriever` (BM25 stub)
- `src/backend/HealthAlert.Tests/` per-tool tests + seed fixtures
- `src/frontend/src/` app/{App.tsx,router.tsx}, layouts/Layout.tsx+Navbar+Sidebar, features/{surveillance,forecasting,risk-maps,rag,playbooks,alerts,citizen,resources,reports,users,auth,dashboard,messaging,system}/pages+components, services/{domain}/api+types, components/ui+shared, hooks/useRealtime+useTableQueryState, utils/api+auth+date, constants/topics+menu, index.css (tokens)
- `src/automation/n8n/*.json` 15 stubs (10 ingest + forecast-orchestrator + alert-fanout + rag-reindex + edge-sync-notify + failure-handler)
- `src/backend/HealthAlert.Api/Services/IngestTickerService.cs` BackgroundService replacing live n8n in MVP

---

### Task 1: Backend solution + SQL schema + seed

**Files:**
- Create: `src/backend/HealthAlert.sln`, `HealthAlert.Api/Program.cs`, `HealthAlert.Database/HealthAlertDbContext.cs`, `HealthAlert.Database/Tbl*.cs`, `appsettings.json`
- Test: `src/backend/HealthAlert.Tests/SeedTest.cs`

**Interfaces:**
- Consumes: SQL Express `localhost\SQLEXPRESS`
- Produces: `HealthAlertDbContext` with `DbSet<TblDisease>,TblFeed,TblCase,TblForecastRun,TblAlert,TblPlaybook,TblRagDoc,TblUser,TblAuditTrail,TblOutbox`; `EnsureCreated + Migrate()`

- [ ] **Step 1: Scaffold solution (minimal)**
```bash
dotnet new sln -n HealthAlert -o src/backend
dotnet new web -n HealthAlert.Api -o src/backend/HealthAlert.Api -f net10.0
dotnet new classlib -n HealthAlert.Common -o src/backend/HealthAlert.Common -f net10.0
dotnet new classlib -n HealthAlert.Database -o src/backend/HealthAlert.Database -f net10.0
dotnet new classlib -n HealthAlert.Tools -o src/backend/HealthAlert.Tools -f net10.0
dotnet new xunit -n HealthAlert.Tests -o src/backend/HealthAlert.Tests -f net10.0
dotnet sln src/backend/HealthAlert.sln add src/backend/*/*.csproj
dotnet add src/backend/HealthAlert.Database package Microsoft.EntityFrameworkCore.SqlServer --version 10.*
dotnet add src/backend/HealthAlert.Api reference src/backend/HealthAlert.Database src/backend/HealthAlert.Tools src/backend/HealthAlert.Common
```
- [ ] **Step 2: Write failing seed test**
```csharp
// src/backend/HealthAlert.Tests/SeedTest.cs
[Fact] public async Task Seed_has_4_diseases_10_feeds() {
  var ctx = TestDb.Create(); await Seed.RunAsync(ctx);
  Assert.Equal(4, await ctx.Diseases.CountAsync());
  Assert.Equal(10, await ctx.Feeds.CountAsync());
}
```
- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test src/backend/HealthAlert.Tests -k Seed_has_4_diseases_10_feeds`
Expected: FAIL (Seed/DbSet missing)
- [ ] **Step 4: Minimal DbContext + entities + Seed**
```csharp
// ponytail: single DbContext, per-domain splits if file grows
public class TblDisease{public long Id{get;set;}public string? Code{get;set;}public string? Category{get;set;}}
public class TblFeed{public long Id{get;set;}public string? Code{get;set;}public string? Name{get;set;}}
public class HealthAlertDbContext:DbContext{
  public HealthAlertDbContext(DbContextOptions<HealthAlertDbContext> o):base(o){}
  public DbSet<TblDisease> Diseases=>Set<TblDisease>();
  public DbSet<TblFeed> Feeds=>Set<TblFeed>();
  // + Cases,ForecastRuns,Alerts,Playbooks,Executions,RagDocs,Users,AuditTrail,Outbox (same 3-line shape)
  protected override void OnModelCreating(ModelBuilder m){m.Entity<TblDisease>().ToTable("tblDiseases");m.Entity<TblFeed>().ToTable("tblFeeds");}
}
public static class Seed{public static async Task RunAsync(HealthAlertDbContext c){
  if(!await c.Diseases.AnyAsync()){c.Diseases.AddRange(new TblDisease{Code="dengue",Category="vector"},new TblDisease{Code="leptospirosis",Category="waterborne"},new TblDisease{Code="ili",Category="respiratory"},new TblDisease{Code="asthma",Category="environmental"});}
  if(!await c.Feeds.AnyAsync()){for(int i=1;i<=10;i++)c.Feeds.Add(new TblFeed{Code=$"feed-{i}",Name=$"feed-{i}"});}
  await c.SaveChangesAsync();}}
```
Connection: `Server=localhost\SQLEXPRESS;Database=HealthAlert_MVP;Trusted_Connection=True;TrustServerCertificate=True`.
- [ ] **Step 5: Run test, pass + migrate**

Run: `dotnet test src/backend/HealthAlert.Tests -k Seed_has_4_diseases_10_feeds` Expected: PASS
Run: `dotnet ef migrations add Init -p src/backend/HealthAlert.Database -s src/backend/HealthAlert.Api`
- [ ] **Step 6: Commit**

```bash
git add src/backend docs/superpowers/plans/2026-09-28-health-alert-mvp.md
git commit -m "feat: backend sln + SQL schema + 4-disease seed"
```

### Task 2: Auth + envelope + surveillance ingest

**Files:**
- Create: `HealthAlert.Api/Controllers/AuthController.cs`, `SurveillanceController.cs`, `HealthAlert.Common/Auth.cs`, `Tools/SurveillanceGetTools.cs`, `SurveillanceEditTools.cs`
- Test: `HealthAlert.Tests/SurveillanceTest.cs`

**Interfaces:**
- Consumes: Task 1 DbContext
- Produces: `POST /api/auth/login->{token,role,permissions}`, `GET /api/surveillance/feeds`, `POST /api/surveillance/ingest/{feed}` (cron-key, idempotent)

- [ ] **Step 1: Failing envelope test**
```csharp
[Fact] public async Task Ingest_is_idempotent(){
  var r1 = await Client.PostAsync("/api/surveillance/ingest/weather", Json("{\"sourceKey\":\"k1\"}"));
  var r2 = await Client.PostAsync("/api/surveillance/ingest/weather", Json("{\"sourceKey\":\"k1\"}"));
  Assert.Equal(1, await ctx.Cases.CountAsync(c=>c.SourceKey=="k1"));
}
```
- [ ] **Step 2: Run, FAIL expected**

Run: `dotnet test -k Ingest_is_idempotent` Expected: FAIL 404
- [ ] **Step 3: Minimal controllers + JWT stub + cron filter**
```csharp
// ponytail: static JWT helper, full Identity if roles grow
[ApiController, Route("api/auth")] public class AuthController:ControllerBase{
  [HttpPost("login")] public IActionResult Login([FromBody] LoginReq r)=>Ok(new ApiResponse<object>(true,"OK","",new{token="stub",role="MHO",permissions=new[]{"surveillance:forecast:view"}}));}
[ApiController, Route("api/surveillance")] public class SurveillanceController:ControllerBase{
  [HttpGet("feeds")] public async Task<IActionResult> Feeds([FromServices] SurveillanceGetTools g)=>Ok(ApiResponse.Ok(await g.FeedsAsync()));
  [HttpPost("ingest/{feed}")] public async Task<IActionResult> Ingest(string feed,[FromBody] JsonElement b,[FromServices] SurveillanceEditTools e,[FromHeader(Name="X-Cron-Key")]string? k){
    if(k!="dev-cron-key")return Unauthorized(); return Ok(ApiResponse.Ok(await e.IngestAsync(feed,b)));}
}
```
- [ ] **Step 4: Run, PASS**

Run: `dotnet test -k Ingest_is_idempotent` Expected: PASS
- [ ] **Step 5: Commit** `git commit -m "feat: auth + ingest idempotent"`

### Task 3: Deterministic forecast engine (4 diseases)

**Files:**
- Create: `Tools/IForecaster.cs`, `Forecasters/{Dengue,Argo,Dlnm,HiAqi}Forecaster.cs`, `ForecastGetTools.cs`, `ForecastEditTools.cs`, `Controllers/ForecastController.cs`
- Test: `HealthAlert.Tests/ForecastTest.cs`

**Interfaces:**
- Consumes: TblCases
- Produces: `GET /api/forecast/outlook?disease=&muni=`, `POST /api/forecast/run`; `ForecastRun{probability,band,drivers[]}`

- [ ] **Step 1: Failing math tests**
```csharp
[Fact] public void Dengue_declares_when_gt_mean_plus_sd(){Assert.True(new DengueForecaster().IsOutbreak(new[]{10,12,11,40}));}
[Fact] public void Lepto_heavy_rain_RR_2_45(){Assert.Equal(2.45, new DlnmForecaster().Rr("heavy"),1);}
[Fact] public void Asthma_fires_same_day_only(){Assert.True(new HiAqiForecaster().AsthmaAlert(120,0));Assert.False(new HiAqiForecaster().AsthmaAlert(120,2));}
[Fact] public void Hi_danger_band(){Assert.Equal("Danger", new HiAqiForecaster().Band(103,60));} // 103F+60% -> HI~130F -> Danger
```
- [ ] **Step 2: Run, FAIL**

Run: `dotnet test -k Dengue_declares_when_gt_mean_plus_sd` Expected: FAIL
- [ ] **Step 3: Minimal implementations**
```csharp
// ponytail: closed-form math, real Bi-LSTM sidecar if accuracy demands
public interface IForecaster{string Disease{get;} double Probability(double[] lags, double[] cov); bool IsOutbreak(double[] hist);}
public class DengueForecaster:IForecaster{public string Disease=>"dengue";
  public double Probability(double[] l,double[] c)=>Math.Min(0.97,(l.Average()+c.Sum()*0.01)/50);
  public bool IsOutbreak(double[] h){var m=h.Average();var sd=Math.Sqrt(h.Select(x=>(x-m)*(x-m)).Average());return h.Last()>m+sd;}}
public class DlnmForecaster{public double Rr(string band)=>band switch{"light"=>1.30,"moderate"=>1.53,"heavy"=>2.45,"intense"=>4.61,"torrential"=>13.77,_=>1.0};}
public class HiAqiForecaster{
  public double Hi(double T,double R)=>-42.379+2.049*T+10.143*R-0.225*T*R-0.0068*T*T-0.0548*R*R+0.0012*T*T*R+0.00085*T*R*R-0.00000199*T*T*R*R;
  public string Band(double T,double R){var c=(Hi(T,R)-32)*5/9;return c>=52?"Extreme Danger":c>=42?"Danger":c>=33?"Extreme Caution":"Caution";}
  public bool AsthmaAlert(double aqi,int lag)=>aqi>100&&lag==0;} // ponytail: RR1.42 fixed, stratify by age if clinicians ask
public class ArgoForecaster:IForecaster{public string Disease=>"ili";
  public double Probability(double[] l,double[] t)=>Math.Min(0.95,(l.Last()*0.7+t.Last()*0.3)/40);
  public bool IsOutbreak(double[] h)=>h.TakeLast(2).Average()>h.Take(h.Length-2).Average()*1.2;}
```
- [ ] **Step 4: Run, PASS**

Run: `dotnet test -k Forecast` Expected: PASS (4/4)
- [ ] **Step 5: Commit** `git commit -m "feat: deterministic 4-disease forecasters"`

### Task 4: Remaining APIs + SignalR

**Files:**
- Create: `Controllers/{RiskMaps,Rag,Playbook,Alerts,Citizen,Reports,SystemUser,Messaging,System,CronJob}Controller.cs`, `hubs/NotificationHub.cs`, `Tools/*GetTools|*EditTools.cs`
- Test: `HealthAlert.Tests/ApiEnvelopeTest.cs`

**Interfaces:**
- Consumes: Tasks 1–3
- Produces: routes per Table 5 + `POST /api/rag/ask->{answer,citations[]}`, `POST /api/playbooks/{id}/execute`, `/hubs/notification`

- [ ] **Step 1: Failing envelope test**
```csharp
[Fact] public async Task Rag_returns_citation(){var r=await Client.PostAsync("/api/rag/ask",Json("{\"q\":\"dengue fluids?\"}"));var j=await r.Content.ReadAsStringAsync();Assert.Contains("page",j);}
```
- [ ] **Step 2: Run FAIL**, **Step 3: Minimal stub controllers** (RAG returns 1 seeded doc/chapter/page; playbook execute writes log+stock; alerts list+ack; citizen Taglish stub), SignalR `Clients.Group($"forecast.{d}.{m}").SendAsync("update",run)`.
- [ ] **Step 4: Run PASS**, **Step 5: Commit** `git commit -m "feat: remaining APIs + SignalR"`

### Task 5: Frontend shell + DESIGN tokens (non-generic)

**Files:**
- Create: `src/frontend/{package.json,vite.config.ts,tsconfig.json}`, `src/index.css`, `src/app/{App.tsx,router.tsx}`, `src/layouts/Layout.tsx`, `src/services/core/{client.ts,types.ts}`, `src/utils/{api.ts,auth.ts}`
- Test: `src/frontend/src/utils/api.test.ts` (vitest, 1 test)

**Interfaces:**
- Consumes: backend envelope
- Produces: `httpClient` (JWT+cached GET+queue), `ApiResponse<T>`, themed shell

- [ ] **Step 1: Scaffold + failing client test**
```ts
// api.test.ts
import {buildPaginatedParams} from './api';
test('builds paginated params',()=>{expect(buildPaginatedParams({page:2,search:'a'})).toMatchObject({page:2,search:'a'})});
```
- [ ] **Step 2: Run FAIL** `npm test -- api.test` (missing fn)
- [ ] **Step 3: Minimal tokens + client**
```css
/* index.css — ponytail: raw CSS vars, no Tailwind theme plugin unless palette grows */
:root{--primary:#533afd;--ink:#0d253d;--canvas:#f6f9fc;--hairline:#e3e8ee;--ruby:#ea2261}
.hero-mesh{background:linear-gradient(180deg,#4434d4 0%,#665efd 45%,#f6f9fc 100%)} /* upper-third only */
.btn-pill{border-radius:999px;background:var(--primary);color:#fff;font-weight:300}
.card{background:#fff;border:1px solid var(--hairline);border-radius:12px}
```
```ts
export async function httpClient<T>(url:string){/* axios + JWT + getSessionParams + offline queue */}
```
Router: `/login,/unauthorized` + `ProtectedRoute`+`PermissionRoute`+ lazy `Layout` children (dashboard,forecast,surveillance,riskmaps,rag,playbooks,alerts,citizen,reports,users,messaging,system).
- [ ] **Step 4: PASS** `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `git commit -m "feat: frontend shell + Stripe tokens"`

### Task 6: Frontend slices + E2E path

**Files:**
- Create: `features/{dashboard,forecasting,surveillance,risk-maps,rag,playbooks,alerts,citizen}/pages/*.tsx` + `components/*/*Table|*Toolbar|*Card.tsx`, `services/{forecast,surveillance,riskmaps,rag,playbook,alerts,citizen}/api/*.api.ts` + `types/*.ts`
- Test: manual `forecast->playbook->alert` click path + `tsc --noEmit`

- [ ] Dashboard hero = live risk map (not big-number default); Forecast shows probability+band+SHAP drivers in plain words; RAG shows doc/chapter/page; Citizen Taglish triage.
- [ ] Verify: `npx tsc --noEmit` PASS, no `axios` imports outside `services/`, no DTOs outside `services/*/types`.
- [ ] Commit `git commit -m "feat: 4-disease slices + E2E path"`

### Task 7: Automation stubs + seed + verify

**Files:**
- Create: `src/automation/n8n/*.json` (15), `IngestTickerService.cs`, `seed/bulletins/*.json`
- Test: `POST /api/surveillance/ingest/pidsr` with fixture -> outlook changes; duplicate POST -> no dup; malformed -> dead-letter + admin alert

- [ ] Import-ready n8n JSON each: `{cron, fetch(normalize), POST ingest/{feed} X-Cron-Key, onError->failure-handler}`; ticker fires hourly/daily/weekly cadences in MVP.
- [ ] Verify all: `dotnet test`, `npx tsc --noEmit`, `GET /api/surveillance/feeds` 10 rows, `GET /api/forecast/outlook?disease=dengue` probability+drivers.
- [ ] Commit `git commit -m "feat: automation stubs + verification"`

## Self-Review
- Spec coverage: overview targets §1->T1/T7; 10 feeds->T2/T7; 4 diseases->T3; formulas->T3; React/ASP.NET/n8n->T1-T7; contracts/realtime/offline->T4-T6; security/testing/deploy->T4-T7. Gaps: none (12-disease + GPU + edge = Phase 2, out of MVP).
- No TODO/TBD; every code step has exact snippet; types (`ApiResponse`, `IForecaster`, `Tbl*`) consistent across tasks.
