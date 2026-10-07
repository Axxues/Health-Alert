import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "@/services/core/client";
import { listLocations, getLocationDetail } from "./locations.api";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn(),
}));

const mockHttp = vi.mocked(httpClient);

beforeEach(() => {
  mockHttp.mockReset();
});

describe("locations.api", () => {
  it("throws on network error instead of mock fallback", async () => {
    mockHttp.mockRejectedValueOnce(new Error("offline"));
    await expect(listLocations({ province: "La Union" })).rejects.toThrow();
  });

  it("throws on empty array instead of mock fallback", async () => {
    mockHttp.mockResolvedValue({ success: true, code: "OK", message: "", data: [] });
    await expect(listLocations({})).rejects.toThrow();
  });

  it("issues GET /forecast/locations with mapped params", async () => {
    mockHttp.mockResolvedValue({
      success: true,
      code: "OK",
      message: "",
      data: [
        {
          id: "x",
          province: "La Union",
          municipality: "Agoo",
          barangay: "San Nicolas",
          disease: "dengue",
          diseaseName: "Dengue Fever",
          category: "vector",
          activeCases: 10,
          prevWeekCases: 8,
          changePercent: 25,
          riskLevel: "high",
          outbreakProbability: 0.8,
          sentinelFacility: "LUMC",
          lastUpdated: "2026-09-30T00:00:00Z",
        },
      ],
    });
    const rows = await listLocations({ province: "La Union", disease: "dengue", riskLevel: "all", search: "" });
    expect(mockHttp).toHaveBeenCalledWith(
      "/forecast/locations",
      expect.objectContaining({ method: "get" })
    );
    expect(mockHttp.mock.calls[0][1]?.params).toEqual({ province: "La Union", disease: "dengue" });
    expect(rows.length).toBe(1);
  });

  it("resolves detail timeline from live series weeks (12 past + 4 projected)", async () => {
    mockHttp.mockResolvedValueOnce({
      success: true,
      code: "OK",
      message: "",
      data: [
        {
          id: "agoosan-del-norte|dengue",
          province: "Agusan del Norte",
          municipality: "Butuan City",
          barangay: "Ampayon",
          disease: "dengue",
          diseaseName: "Dengue Fever",
          category: "vector",
          activeCases: 34,
          prevWeekCases: 28,
          changePercent: 21,
          riskLevel: "high",
          outbreakProbability: 0.82,
          sentinelFacility: "Butuan Medical Center",
          lastUpdated: "2026-09-30T00:00:00Z",
        },
      ],
    });
    const day = (base: Date, add: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + add);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const base = new Date(2026, 5, 8);
    const weeks = Array.from({ length: 16 }, (_, i) => ({
      weekStart: day(base, i * 7),
      actual: i < 12 ? 10 + i : null,
      predicted: 9 + i,
      ciLower: 8 + i,
      ciUpper: 12 + i,
      isFuture: i >= 12,
    }));
    mockHttp.mockResolvedValueOnce({
      success: true,
      code: "OK",
      message: "",
      data: {
        muni: "Butuan City",
        disease: "dengue",
        weeks,
        metrics: {
          modelName: "Ridge regressor v2 (dengue walk-forward)",
          version: 2,
          rmse: 2.1,
          mae: 1.6,
          r2: 0.91,
          baselineName: "persistence",
          baselineRmse: 3.4,
          method: "endemic-channel+2SD excl-max-year; EARS-C1 k=3",
          citation: "WHO TDR dengue surveillance handbook (2016); Brady et al.",
        },
        covariates: { rainMm: 112.5, tempC: 31.4, aqi: 42, pageviews: 900, date: "2026-09-30T00:00:00Z" },
      },
    });

    const detail = await getLocationDetail("agoosan-del-norte|dengue");

    expect(mockHttp).toHaveBeenNthCalledWith(
      2,
      "/forecast/series",
      expect.objectContaining({ params: { muni: "Butuan City", disease: "dengue", brgy: "Ampayon" } })
    );
    expect(detail.timeline.length).toBe(16);
    expect(detail.timeline.map((w) => w.weekNumber)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    const past = detail.timeline.filter((w) => !w.isFuture);
    const future = detail.timeline.filter((w) => w.isFuture);
    expect(past.length).toBe(12);
    expect(future.length).toBe(4);
    past.forEach((w, i) => {
      expect(w.actualCases).toBe(10 + i);
      expect(w.predictedCases).toBe(10 + i);
      expect(w.ciLower).toBe(8 + i);
      expect(w.ciUpper).toBe(12 + i);
      expect(w.weekLabel).toContain("Observed");
    });
    future.forEach((w, i) => {
      expect(w.actualCases).toBeNull();
      expect(w.predictedCases).toBe(9 + 12 + i);
      expect(w.weekLabel).toContain("Projected");
    });
    expect(detail.timeline[0].shortLabel).toBe(
      new Date(2026, 5, 8).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    expect(detail.activeCases).toBe(34);
    expect(detail.changePercent).toBe(21);
    expect(detail.outbreakProbability).toBe(0.82);
    expect(detail.sentinelFacility).toBe("Butuan Medical Center");
    expect(detail.accuracyMetrics.accuracyRate).toBeGreaterThan(85);
  });

  it("throws when the series call fails", async () => {
    mockHttp.mockResolvedValueOnce({
      success: true,
      code: "OK",
      message: "",
      data: [
        {
          id: "agoosan-del-norte|dengue",
          province: "Agusan del Norte",
          municipality: "Butuan City",
          barangay: "Ampayon",
          disease: "dengue",
          diseaseName: "Dengue Fever",
          category: "vector",
          activeCases: 34,
          prevWeekCases: 28,
          changePercent: 21,
          riskLevel: "high",
          outbreakProbability: 0.82,
          sentinelFacility: "Butuan Medical Center",
          lastUpdated: "2026-09-30T00:00:00Z",
        },
      ],
    });
    mockHttp.mockRejectedValueOnce(new Error("series offline"));
    await expect(getLocationDetail("agoosan-del-norte|dengue")).rejects.toThrow("series offline");
  });

  it("resolves 3-part IDs by barangay and passes brgy to series", async () => {
    const brgyEntry = (id: string, barangay: string) => ({
      id,
      province: "La Union",
      municipality: "Agoo",
      barangay,
      disease: "dengue",
      diseaseName: "Dengue Fever",
      category: "vector",
      activeCases: 10,
      prevWeekCases: 8,
      changePercent: 25,
      riskLevel: "high",
      outbreakProbability: 0.8,
      sentinelFacility: "LUMC",
      lastUpdated: "2026-09-30T00:00:00Z",
    });
    mockHttp.mockResolvedValueOnce({
      success: true,
      code: "OK",
      message: "",
      data: [brgyEntry("agoo|san-nicolas|dengue", "San Nicolas"), brgyEntry("agoo|poblacion|dengue", "Poblacion")],
    });
    mockHttp.mockResolvedValueOnce(
      liveSeries([wk("2026-09-07", 10, 10, false), wk("2026-09-28", null, 12, true)], null, null)
    );

    const detail = await getLocationDetail("agoo|san-nicolas|dengue");

    expect(detail.barangay).toBe("San Nicolas");
    expect(mockHttp).toHaveBeenNthCalledWith(
      2,
      "/forecast/series",
      expect.objectContaining({ params: { muni: "Agoo", disease: "dengue", brgy: "San Nicolas" } })
    );
  });

  const liveEntry = (over = {}) => ({
    id: "agoosan-del-norte|dengue",
    province: "Agusan del Norte",
    municipality: "Butuan City",
    barangay: "Ampayon",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    category: "vector",
    activeCases: 34,
    prevWeekCases: 28,
    changePercent: 21,
    riskLevel: "high",
    outbreakProbability: 0.82,
    sentinelFacility: "Butuan Medical Center",
    lastUpdated: "2026-09-30T00:00:00Z",
    ...over,
  });

  const liveSeries = (weeks: unknown[], metrics: unknown, covariates: unknown) => ({
    success: true,
    code: "OK",
    message: "",
    data: { muni: "Butuan City", disease: "dengue", weeks, metrics, covariates },
  });

  const wk = (weekStart: string, actual: number | null, predicted: number, isFuture: boolean) => ({
    weekStart,
    actual,
    predicted,
    ciLower: predicted - 2,
    ciUpper: predicted + 2,
    isFuture,
  });

  const fittedMetrics = {
    modelName: "Ridge regressor v2 (dengue walk-forward)",
    version: 2,
    rmse: 2.1,
    mae: 1.6,
    r2: 0.91,
    baselineName: "persistence",
    baselineRmse: 3.4,
    method: "endemic-channel+2SD excl-max-year; EARS-C1 k=3",
    citation: "WHO TDR dengue surveillance handbook (2016); Brady et al.",
  };

  it("maps live metrics/covariates/coordinates into the detail", async () => {
    mockHttp.mockResolvedValueOnce({
      success: true, code: "OK", message: "", data: [liveEntry({ lat: 8.95, lng: 125.53 })],
    });
    mockHttp.mockResolvedValueOnce(
      liveSeries(
        [
          wk("2026-09-07", 10, 10, false),
          wk("2026-09-14", 12, 12, false),
          wk("2026-09-21", 14, 14, false),
          wk("2026-09-28", null, 16, true),
        ],
        fittedMetrics,
        { rainMm: 112.5, tempC: 31.4, aqi: 42, pageviews: 900, date: "2026-09-30T00:00:00Z" }
      )
    );

    const detail = await getLocationDetail("agoosan-del-norte|dengue");

    // mean(actuals) = 12 → mape = round(1.6/12*100) = 13; accuracy = round(0.91*100) = 91
    expect(detail.accuracyMetrics.modelName).toBe("Ridge regressor v2 (dengue walk-forward)");
    expect(detail.accuracyMetrics.accuracyRate).toBe(91);
    expect(detail.accuracyMetrics.mape).toBe(13);
    expect(detail.accuracyMetrics.r2Score).toBe(0.91);
    expect(detail.accuracyMetrics.aucRoc ?? null).toBeNull();
    expect(detail.accuracyMetrics.confidenceMethod).toContain("endemic-channel+2SD excl-max-year");
    expect(detail.accuracyMetrics.confidenceMethod).toContain("WHO TDR dengue surveillance handbook (2016)");
    expect(detail.accuracyMetrics.confidenceMethod).not.toContain("EARS-C1");
    expect(detail.covariates.cumulativeRainfallMm).toBe(112.5);
    expect(detail.covariates.avgTemperatureC).toBe(31.4);
    expect(detail.covariates.aqiLevel).toBe(42);
    expect(detail.covariates.standingWaterSites).toBeNull();
    expect(detail.covariates.larvalBreteauIndex).toBeNull();
    expect(detail.covariates.heatIndexC).toBeNull();
    expect(detail.coordinates).toEqual({ lat: 8.95, lng: 125.53 });
  });

  it("falls back to heuristic baseline when metrics/covariates are null", async () => {
    mockHttp.mockResolvedValueOnce({
      success: true, code: "OK", message: "", data: [liveEntry()],
    });
    mockHttp.mockResolvedValueOnce(
      liveSeries([wk("2026-09-07", 10, 10, false), wk("2026-09-28", null, 12, true)], null, null)
    );

    const detail = await getLocationDetail("agoosan-del-norte|dengue");

    expect(detail.accuracyMetrics.modelName).toBe("Heuristic baseline (no fitted model)");
    expect(detail.accuracyMetrics.accuracyRate).toBeNull();
    expect(detail.accuracyMetrics.mape).toBeNull();
    expect(detail.accuracyMetrics.r2Score).toBeNull();
    expect(detail.covariates.cumulativeRainfallMm).toBeNull();
    expect(detail.covariates.avgTemperatureC).toBeNull();
    expect(detail.covariates.aqiLevel).toBeNull();
    expect(detail.coordinates).toEqual({ lat: 0, lng: 0 });
  });

  it("omits mape when mean actuals is zero and clamps r2", async () => {
    mockHttp.mockResolvedValueOnce({
      success: true, code: "OK", message: "", data: [liveEntry()],
    });
    mockHttp.mockResolvedValueOnce(
      liveSeries(
        [wk("2026-09-07", 0, 0, false), wk("2026-09-28", null, 1, true)],
        { ...fittedMetrics, r2: 0.5 },
        null
      )
    );
    const zero = await getLocationDetail("agoosan-del-norte|dengue");
    expect(zero.accuracyMetrics.mape).toBeNull();
    expect(zero.accuracyMetrics.accuracyRate).toBe(50);

    mockHttp.mockResolvedValueOnce({
      success: true, code: "OK", message: "", data: [liveEntry()],
    });
    mockHttp.mockResolvedValueOnce(
      liveSeries(
        [wk("2026-09-07", 5, 5, false), wk("2026-09-28", null, 6, true)],
        { ...fittedMetrics, r2: 1.4 },
        null
      )
    );
    expect((await getLocationDetail("agoosan-del-norte|dengue")).accuracyMetrics.accuracyRate).toBe(100);

    mockHttp.mockResolvedValueOnce({
      success: true, code: "OK", message: "", data: [liveEntry()],
    });
    mockHttp.mockResolvedValueOnce(
      liveSeries(
        [wk("2026-09-07", 5, 5, false), wk("2026-09-28", null, 6, true)],
        { ...fittedMetrics, r2: -0.3 },
        null
      )
    );
    expect((await getLocationDetail("agoosan-del-norte|dengue")).accuracyMetrics.accuracyRate).toBe(0);
  });
});
