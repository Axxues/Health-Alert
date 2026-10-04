# Literature-Grounded Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace invented thresholds with literature methods, compare every model against naive baselines, and produce a citable backtest table.

**Architecture:** `EndemicChannel` static methods (5-yr rolling mean+2SD bands, 2-week confirmation) feed band assignment; `BaselineForecasts` (persistence, seasonal-naive-52) runs inside walk-forward evaluation beside ridge; `POST /forecast/backtest?disease=` returns the comparison table; probability = logistic of endemic-channel z-score.

**Tech Stack:** .NET 10, EF Core, xUnit. No new packages.

**Spec:** user directive 2026-10-01 (literature basis + manual baseline backtest).

## Literature basis (cite in code comments)

- Endemic channel +2 SD, 5-yr baseline excluding epidemic years: WHO TDR Technical handbook for dengue surveillance, outbreak prediction/detection and response (2016); Brady et al., PLoS NTD 2013 (consistency review); Umaña et al., JMIR Public Health Surveill 2026 (parametrization: geometric mean, exclude outlier years, 7-yr window).
- EARS C1/C2 short-baseline triggers: Hutwagner et al., MMWR 2003.
- Serfling epidemic threshold (baseline + 1.64 SD, 2 successive weeks): Serfling, Am J Public Health 1963; CDC ILINet baseline = non-epidemic-week mean + 2 SD.
- MEM intensity bands (40/90/97.5% CI upper limits → medium/high/very high): Vega et al. (WHO method); CDC flu severity classification.
- Alarm-indicator logic: WHO EWARS Operational Guide for Dengue Outbreaks (2017).

## Global Constraints

- Threshold rows gain `Method` + `Citation` string fields documenting which literature each value comes from.
- No invented numbers: every constant cites a source or is grid-selected on walk-forward error (document which).
- ILI/lepto/asthma have no open multi-year PH series — backtest runs on longest available real history per disease; gaps stated, never synthesized.
- Backend `-c Release`; TDD; commit per task.

---

### Task 1: Endemic-channel + EARS + Serfling/MEM threshold engine

**Files:** Create `src/backend/HealthAlert.Tools/EndemicChannel.cs`; modify `RiskBandTools.cs` (consume it), `TblRiskThreshold` (+Method/Citation, seed values per literature); test `EndemicChannelTest.cs`.

- [ ] **Step 1: Failing tests.** `EndemicValue(history5yr) ≈ mean+2SD excluding max year`; `ConfirmFlag([above, above]) == true`, single-week == false; `EarsC1([7 baseline], current)` triggers only beyond ~3 SD; Serfling ILI threshold = baseline mean + 1.64*SD on synthetic seasonal data.
- [ ] **Step 2: Red run.** `dotnet test src/backend/HealthAlert.Tests -c Release --filter "EndemicChannelTest"`
- [ ] **Step 3: Implement** (pure static math, XML doc comments citing each source above).
- [ ] **Step 4: Green full suite.**
- [ ] **Step 5: Migrate + commit** (`AddThresholdMethods`; `git commit -m "feat: literature threshold engine (endemic channel, EARS, Serfling/MEM)"`).

### Task 2: Naive baselines inside evaluation + backtest endpoint

**Files:** Modify `RidgeRegression.cs` (add `BaselineMetrics`: persistence + seasonal-naive-52 RMSE/MAE alongside walk-forward), `ModelRegistryTools.cs` (store `BaselineRmse`/`BaselineMae`/`BaselineName` on the model row — needs `dotnet ef migrations add`), `ForecastController.cs` (`GET backtest?disease=` returning per-disease {ridge, persistence, seasonalNaive} RMSE/MAE/R² + history length + data sources).

- [ ] **Step 1: Failing tests** (baseline metrics on synthetic seasonal data: seasonal-naive beats persistence; endpoint returns all three blocks).
- [ ] **Step 2-4:** Red, implement, green full suite.
- [ ] **Step 5: Migrate + commit** (`git commit -m "feat: naive-baseline comparison and backtest endpoint"`).

### Task 3: Manual backtest run + reported table (coordinator runs, not a subagent)

- Seed dev DB via HDX backfill + existing history, `POST /forecast/train` per disease, `GET /forecast/backtest?disease=` × 4, publish the table in chat with the honest verdict (where ridge beats naive, where it doesn't, and the history-length caveat per disease).
