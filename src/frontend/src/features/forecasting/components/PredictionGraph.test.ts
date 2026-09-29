import { describe, it, expect } from "vitest";
import { computeChartScales } from "./PredictionGraph";
import type { TimelineWeek } from "@/services/forecast/types/forecast.types";

const mockTimeline: TimelineWeek[] = [
  { weekNumber: 31, weekLabel: "W31", isFuture: false, actualCases: 12, predictedCases: 11, ciLower: 9, ciUpper: 14 },
  { weekNumber: 32, weekLabel: "W32", isFuture: false, actualCases: 18, predictedCases: 17, ciLower: 14, ciUpper: 21 },
  { weekNumber: 33, weekLabel: "W33", isFuture: true, actualCases: null, predictedCases: 25, ciLower: 20, ciUpper: 30 },
];

describe("PredictionGraph helpers", () => {
  it("computes accurate SVG scaling and coordinates", () => {
    const scales = computeChartScales(mockTimeline, 800, 300);
    expect(scales.maxVal).toBeGreaterThanOrEqual(30);
    expect(scales.points.length).toBe(3);
    expect(scales.points[0].x).toBeLessThan(scales.points[1].x);
    expect(scales.points[1].x).toBeLessThan(scales.points[2].x);
  });

  it("calculates confidence polygon points correctly", () => {
    const scales = computeChartScales(mockTimeline, 800, 300);
    expect(scales.confidencePolygon).toBeDefined();
    expect(scales.confidencePolygon.length).toBeGreaterThan(0);
  });
});
