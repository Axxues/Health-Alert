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
      data: { muni: "Butuan City", disease: "dengue", weeks },
    });

    const detail = await getLocationDetail("agoosan-del-norte|dengue");

    expect(mockHttp).toHaveBeenNthCalledWith(
      2,
      "/forecast/series",
      expect.objectContaining({ params: { muni: "Butuan City", disease: "dengue" } })
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
});
