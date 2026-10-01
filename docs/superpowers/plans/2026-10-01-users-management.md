# Users Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-only Users page (create, deactivate, assign Admin/Viewer) on hardened backend endpoints.

**Architecture:** `SystemUserEditTools` gains create/deactivate/role-assignment over `tblUsers` (roles constrained to exactly `Admin`/`Viewer`); `SystemUserController` exposes them behind an admin gate; new `features/users` page with a table + create form + role select + deactivate buttons.

**Tech Stack:** .NET 10, EF Core, xUnit, React + Tailwind, `httpClient` service pattern.

**Spec:** `docs/superpowers/specs/2026-10-01-bantayhealthai-realignment-design.md` §4 (users part)

## Global Constraints

- Exactly two roles: `Admin` and `Viewer`. No per-feature matrix.
- Users page is admin-only end to end (route guard + backend gate).
- Frontend follows `services/rag/api/rag.api.ts` + `httpClient` pattern and the Intelligence ledger table style.
- Backend builds/tests run `-c Release`; frontend `npx tsc --noEmit -p tsconfig.json`.
- TDD: failing test first for every task; commit per task.

---

### Task 1: User lifecycle endpoints with admin gate

**Files:**
- Modify: `src/backend/HealthAlert.Tools/SystemUserEditTools.cs` (add `CreateAsync`, `SetActiveAsync`, `SetRoleAsync`)
- Modify: `src/backend/HealthAlert.Api/Controllers/SystemUserController.cs` (add endpoints)
- Test: `src/backend/HealthAlert.Tests/SystemUserLifecycleTest.cs`

**Interfaces:**
- Consumes: `TblUser { Id, Username, Role }` — add `IsActive bool` (default true) via migration.
- Produces: `Task<TblUser> CreateAsync(string username, string role)` (rejects roles outside Admin/Viewer with `InvalidOperationException`); `Task<TblUser?> SetActiveAsync(long id, bool active)`; `Task<TblUser?> SetRoleAsync(long id, string role)`; endpoints `POST /api/users`, `POST /api/users/{id}/active {active}`, `POST /api/users/{id}/role {role}` — all non-admin → `Forbid()`.

Executor: read `SystemUserController.cs` first and follow its existing constructor/auth style exactly.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task Create_rejects_unknown_role()
{
    var ctx = TestDb.Create();
    await Assert.ThrowsAsync<InvalidOperationException>(() => new SystemUserEditTools(ctx).CreateAsync("nurse1", "Superuser"));
}

[Fact]
public async Task Deactivate_hides_user_from_listing()
{
    var ctx = TestDb.Create();
    var tools = new SystemUserEditTools(ctx);
    var u = await tools.CreateAsync("midwife1", "Viewer");
    await tools.SetActiveAsync(u.Id, false);
    Assert.False((await ctx.Users.FindAsync(u.Id))!.IsActive);
}

[Fact]
public async Task Role_change_persists()
{
    var ctx = TestDb.Create();
    var tools = new SystemUserEditTools(ctx);
    var u = await tools.CreateAsync("epi1", "Viewer");
    await tools.SetRoleAsync(u.Id, "Admin");
    Assert.Equal("Admin", (await ctx.Users.FindAsync(u.Id))!.Role);
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release --filter "SystemUserLifecycleTest" 2>&1`
Expected: FAIL (no such methods).

- [ ] **Step 3: Write minimal implementation**

```csharp
public async Task<TblUser> CreateAsync(string username, string role)
{
    if (role is not ("Admin" or "Viewer")) throw new InvalidOperationException($"unknown role {role}");
    var u = new TblUser { Username = username, Role = role, IsActive = true };
    ctx.Users.Add(u);
    await ctx.SaveChangesAsync();
    return u;
}

public async Task<TblUser?> SetActiveAsync(long id, bool active)
{
    var u = await ctx.Users.FindAsync(id);
    if (u is null) return null;
    u.IsActive = active;
    await ctx.SaveChangesAsync();
    return u;
}

public async Task<TblUser?> SetRoleAsync(long id, string role)
{
    if (role is not ("Admin" or "Viewer")) throw new InvalidOperationException($"unknown role {role}");
    var u = await ctx.Users.FindAsync(id);
    if (u is null) return null;
    u.Role = role;
    await ctx.SaveChangesAsync();
    return u;
}
```

Add `IsActive` to `TblUser`, DbSet already exists, controller endpoints with the same admin-gate style used for the broadcast endpoint (alerts plan Task 2 — coordinate: if that plan isn't built yet, gate with explicit `User.IsInRole("Admin")` check returning `Forbid()`, and note the convergence in the commit message).

- [ ] **Step 4: Run tests (new + full suite) to verify they pass**

Run: `dotnet test src/backend/HealthAlert.Tests -c Release 2>&1`
Expected: PASS with zero regressions.

- [ ] **Step 5: Add migration + commit**

Run: `dotnet ef migrations add ExtendUsers --project src/backend/HealthAlert.Database --startup-project src/backend/HealthAlert.Api 2>&1`

```bash
git add src/backend/HealthAlert.Database src/backend/HealthAlert.Tools/SystemUserEditTools.cs src/backend/HealthAlert.Api/Controllers/SystemUserController.cs src/backend/HealthAlert.Tests/SystemUserLifecycleTest.cs
git commit -m "feat: admin-gated user lifecycle endpoints"
```

### Task 2: Users page (table + create + role + deactivate)

**Files:**
- Create: `src/frontend/src/services/users/api/users.api.ts`, `src/frontend/src/services/users/types/users.types.ts` (+ `index.ts` barrels)
- Create: `src/frontend/src/features/users/pages/Users.tsx`
- Modify: router (add `/users` route with Admin guard), menu (add Users entry, Admin-only)

**Interfaces:**
- Consumes: `GET /api/users` → `User[] { id, username, role, isActive }`; `POST /api/users { username, role }`; `POST /api/users/{id}/active`; `POST /api/users/{id}/role`.
- Produces: table (username, role, status, actions), inline create form (username + role select + Add button), per-row role select + Activate/Deactivate button. Non-admins never see the menu entry or route.

- [ ] **Step 1: Write the failing test (service shape)**

Create `src/frontend/src/services/users/api/users.api.test.ts` following the alerts service test pattern (mock `httpClient`, assert `listUsers()` resolves). Implementation exports `listUsers`, `createUser(req)`, `setUserActive(id, active)`, `setUserRole(id, role)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/frontend/src/services/users 2>&1` from `src/frontend`
Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

Service files first, then the page in the Intelligence ledger table style: role shown as plain text (no badge chrome), status as colored word (Active muted-green / Deactivated muted-red), actions as text buttons. Route guard: executor — check how `router.tsx` gates permissions (existing `guard()`/`PermissionRoute` helpers) and add an Admin requirement for `/users`; menu entry rendered only when `getRole() === "Admin"` (same `getRole()` used in `Layout.tsx`).

- [ ] **Step 4: Run typecheck + tests to verify they pass**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1` and `npx vitest run src/frontend/src/services/users 2>&1` from `src/frontend`
Expected: clean typecheck, tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/services/users src/frontend/src/features/users src/frontend/src/app/router.tsx src/frontend/src/constants/layout/menu/menu.tsx
git commit -m "feat: admin-only users management page"
```
