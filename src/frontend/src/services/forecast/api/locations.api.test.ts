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

  it("returns location detail with 8 past weeks and 4 future weeks", async () => {
    const detail = await getLocationDetail("lu-sfc-sevilla", "dengue");
    expect(detail).toBeDefined();
    expect(detail.timeline.length).toBe(12);
    const past = detail.timeline.filter((w) => !w.isFuture);
    const future = detail.timeline.filter((w) => w.isFuture);
    expect(past.length).toBe(8);
    expect(future.length).toBe(4);
    expect(detail.accuracyMetrics.accuracyRate).toBeGreaterThan(85);
    expect(detail.accuracyMetrics.mape).toBeGreaterThan(0);
  });
});
