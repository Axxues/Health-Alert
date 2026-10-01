import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "@/services/core/client";
import { listHotspots } from "./riskmaps.api";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn(),
  getSessionParams: vi.fn(() => ({ sessionId: "anon" })),
}));

const mockHttp = vi.mocked(httpClient);

beforeEach(() => {
  mockHttp.mockReset();
});

describe("riskmaps.api", () => {
  it("throws on network error instead of mock fallback", async () => {
    mockHttp.mockRejectedValueOnce(new Error("offline"));
    await expect(listHotspots()).rejects.toThrow();
  });

  it("throws on empty array instead of mock fallback", async () => {
    mockHttp.mockResolvedValue({ success: true, code: "OK", message: "", data: [] });
    await expect(listHotspots()).rejects.toThrow();
  });

  it("returns hotspots on success", async () => {
    const hotspot = {
      id: "x",
      muni: "Brgy. Sevilla, San Fernando City",
      barangay: "Sevilla",
      municipality: "San Fernando City",
      province: "La Union",
      disease: "dengue",
      diseaseName: "Dengue Fever",
      level: "high",
      lat: 16.6159,
      lng: 120.3209,
      cases: 48,
      probability: 0.82,
    };
    mockHttp.mockResolvedValue({ success: true, code: "OK", message: "", data: [hotspot] });
    const rows = await listHotspots();
    expect(mockHttp).toHaveBeenCalledWith("/riskmaps/hotspots", expect.anything());
    expect(rows).toEqual([hotspot]);
  });
});
