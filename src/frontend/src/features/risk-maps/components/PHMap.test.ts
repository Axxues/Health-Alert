import { describe, it, expect } from "vitest";
import { getBarangayDensityRadius } from "./phMapUtils";

describe("PHMap - getBarangayDensityRadius", () => {
  it("calibrates transmission buffer radius at zoom 15 to prevent overlap between adjacent barangays", () => {
    const highRadius = getBarangayDensityRadius("high", 15);
    const medRadius = getBarangayDensityRadius("medium", 15);
    const baselineRadius = getBarangayDensityRadius("baseline", 15);

    // In Region I, adjacent barangays (e.g. Santa Barbara, San Nicolas, San Antonio in Agoo)
    // are spaced ~200m to 244m apart.
    // The sum of buffer radii for any two adjacent barangays must be less than 240m to prevent overlap.
    expect(medRadius + baselineRadius).toBeLessThan(200);
    expect(highRadius + baselineRadius).toBeLessThan(240);

    // Radii should be ordered strictly by severity
    expect(highRadius).toBeGreaterThan(medRadius);
    expect(medRadius).toBeGreaterThan(baselineRadius);
  });

  it("respects minimum and maximum geographic bounds", () => {
    // At very high zooms (e.g. zoom 18), meters should clamp to minimum footprint
    const highZoomHigh = getBarangayDensityRadius("high", 18);
    const highZoomMed = getBarangayDensityRadius("medium", 18);
    const highZoomLow = getBarangayDensityRadius("low", 18);

    expect(highZoomHigh).toBe(80);
    expect(highZoomMed).toBe(65);
    expect(highZoomLow).toBe(50);

    // At lower zooms (e.g. zoom 11), meters should clamp to maximum boundary
    const lowZoomHigh = getBarangayDensityRadius("high", 11);
    const lowZoomMed = getBarangayDensityRadius("medium", 11);
    const lowZoomLow = getBarangayDensityRadius("low", 11);

    expect(lowZoomHigh).toBe(220);
    expect(lowZoomMed).toBe(160);
    expect(lowZoomLow).toBe(120);
  });

  it("maintains reasonable visual pixel halos across zoom levels 13 to 16", () => {
    for (let zoom = 13; zoom <= 16; zoom++) {
      const metersPerPx = 150000 / Math.pow(2, zoom);
      const medMeters = getBarangayDensityRadius("medium", zoom);
      const pixelRadius = medMeters / metersPerPx;

      // Halo pixel radius should remain cleanly between 8px and 35px
      // (larger than the 12px badge radius, but small enough to never crowd the viewport)
      expect(pixelRadius).toBeGreaterThanOrEqual(8);
      expect(pixelRadius).toBeLessThanOrEqual(35);
    }
  });
});
