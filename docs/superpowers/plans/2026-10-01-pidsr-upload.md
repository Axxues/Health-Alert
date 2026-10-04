# PIDSR Municipality Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Municipalities upload their weekly PIDSR export; rows validate, dedupe, and flow into cases; bad rows quarantine for review.

**Architecture:** `UploadTools` parses/validates CSV (no new packages) into `tblCases` + `tblUploadBatch`/`tblUploadIssue`; endpoints for upload, batches, issues, resolve, and template download; frontend Upload page + review queue; new `Encoder` role (upload + view own scope) alongside Admin/Viewer.

**Tech Stack:** .NET 10, EF Core, xUnit, React + Tailwind, multipart form upload.

**Spec:** user directive 2026-10-01 (PIDSR weekly-report format) + field mapping agreed in chat.

## Global Constraints

- Template columns (exact, this order): morbidity_week, morbidity_year, province, municipality, barangay, facility_name, facility_type, disease_code, cases_this_week, deaths_this_week, age_under5, age_5plus, male, female, prepared_by, contact, date_submitted.
- disease_code accepted: dengue, leptospirosis, ili, asthma (others quarantine as untracked-disease).
- Zero-case rows accepted and stored (reporting compliance evidence).
- SourceKey convention extended (still muni-first so hotspot parsing keeps working): `Muni|Facility|2026-W39|dengue`.
- Deaths > cases quarantines, never silently drops.
- Backend `-c Release`; frontend tsc clean; TDD; commit per task.

---

### Task 1: Template validation + ingest pipeline

**Files:** Modify `HealthAlertDbContext.cs` (+`TblUploadBatch`, +`TblUploadIssue`); create `HealthAlert.Tools/UploadTools.cs`; modify `SurveillanceController.cs` (POST upload, GET batches, GET issues, POST resolve, GET template) + `AuthController.cs` (Encoder role — read it first, extend the stub consistently); test `UploadPipelineTest.cs`.

**Rules:** week 1–53, year 2000–2100, not a future week; non-negative ints; required fields non-blank; dedupe on SourceKey (skip counting as duplicate); quarantine reasons: unknown-disease, bad-week, future-week, negative-count, deaths-exceed-cases, missing-required. Batch status: clean/reviewed. Resolve accept writes the case row (re-validated); discard marks resolved. Template endpoint returns header + one commented example row.

- [ ] **Step 1: Failing tests** — valid CSV (3 rows incl. one zero-report) → 3 accepted; bad CSV (unknown disease, future week, deaths>cases, duplicate of first) → accepted/quarantined/duplicates counted; resolve-accept writes case; Encoder gate (non-admin non-encoder → Forbid).
- [ ] **Step 2: Red run** `dotnet test src/backend/HealthAlert.Tests -c Release --filter "UploadPipelineTest"`
- [ ] **Step 3: Implement** (hand-rolled CSV split supporting quoted commas; keep it small).
- [ ] **Step 4: Green full suite.**
- [ ] **Step 5: Migrate + commit** (`AddUploadBatches`; `git commit -m "feat: PIDSR upload pipeline with quarantine review"`).

### Task 2: Upload page + review queue

**Files:** services `src/services/uploads/...` (mirror alerts barrels + test), page `src/features/uploads/pages/Uploads.tsx`, router `/uploads`, menu entry, Sidebar icon, role visibility (Admin + Encoder — read how Layout filters `/users` and extend the same predicate).

**Page:** template download button (GET template → Blob download), file picker + Upload button showing result summary (accepted/quarantined/duplicates + batch id), batches table, per-batch issues table with Accept/Discard buttons, error/empty states. Encoder sees only this page + dashboards (menu predicate handles the rest).

- [ ] **Steps:** service test red→green; page; `tsc` + `vitest` green; commit `git commit -m "feat: municipality upload page with review queue"`.
