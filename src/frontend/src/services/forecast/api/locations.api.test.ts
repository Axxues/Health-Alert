import { describe, it, expect } from "vitest";
import { listLocations, getLocationDetail } from "./locations.api";

describe("locations.api", () => {
  it("returns filtered list of disease locations", async () => {
    const all = await listLocations({});
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toHaveProperty("province");
    expect(all[0]).toHaveProperty("municipality");
    expect(all[0]).toHaveProperty("barangay");
    expect(all[0]).toHaveProperty("activeCases");
  });

  it("filters locations by province", async () => {
    const lu = await listLocations({ province: "La Union" });
    expect(lu.length).toBeGreaterThan(0);
    expect(lu.every((l) => l.province === "La Union")).toBe(true);
  });

  it("filters locations by search text", async () => {
    const sfc = await listLocations({ search: "Sevilla" });
    expect(sfc.length).toBeGreaterThan(0);
    expect(sfc.some((l) => l.barangay === "Sevilla")).toBe(true);
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
