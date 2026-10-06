import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { DashboardDetailDrawer, type DashboardDetailTarget } from "./DashboardDetailDrawer";
import type { Hotspot } from "@/services/riskmaps/types";
import type { ForecastOutlook } from "@/services/forecast/types";

const mockSpots: Hotspot[] = [
  {
    id: "loc-1",
    muni: "San Fernando City",
    province: "La Union",
    barangay: "Catbangen",
    disease: "dengue",
    diseaseName: "Dengue Fever",
    level: "high",
    cases: 42,
    probability: 0.88,
    lat: 16.6159,
    lng: 120.321,
    sentinelFacility: "Ilocos Training and Regional Medical Center",
  },
  {
    id: "loc-2",
    muni: "Agoo",
    province: "La Union",
    barangay: "San Nicolas",
    disease: "leptospirosis",
    diseaseName: "Leptospirosis",
    level: "med",
    cases: 12,
    probability: 0.54,
    lat: 16.3214,
    lng: 120.3648,
    sentinelFacility: "La Union Medical Center",
  },
];

const mockOutlooks: Record<string, ForecastOutlook> = {
  dengue: {
    probability: 0.82,
    band: "High Alert",
    drivers: ["Rainfall", "Temperature"],
  },
};

describe("DashboardDetailDrawer", () => {
  it("renders null when target is null", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardDetailDrawer
          target={null}
          onClose={() => {}}
          spots={mockSpots}
          outlooks={mockOutlooks}
        />
      </MemoryRouter>
    );
    expect(html).toBe("");
  });

  it("renders disease detail drawer with backdrop blur and covariate analysis", () => {
    const target: DashboardDetailTarget = { type: "disease", disease: "dengue" };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardDetailDrawer
          target={target}
          onClose={() => {}}
          spots={mockSpots}
          outlooks={mockOutlooks}
        />
      </MemoryRouter>
    );

    // Verifies full-screen backdrop blur covering header and sidenav
    expect(html).toContain("backdrop-blur-md");
    expect(html).toContain("fixed inset-0 z-50");
    // Verifies disease content
    expect(html).toContain("Dengue");
    expect(html).toContain("Predictive Surge");
    expect(html).toContain("82%");
    expect(html).toContain("San Fernando City");
    expect(html).toContain("Climatic &amp; Environmental Covariates");
  });

  it("renders metric detail drawer for active hotspots", () => {
    const target: DashboardDetailTarget = { type: "metric", metricId: "hotspots" };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardDetailDrawer
          target={target}
          onClose={() => {}}
          spots={mockSpots}
          outlooks={mockOutlooks}
        />
      </MemoryRouter>
    );

    expect(html).toContain("Active Hotspot Surveillance");
    expect(html).toContain("San Fernando City");
    expect(html).toContain("Agoo");
    expect(html).toContain("Critical Alerts");
  });

  it("renders metric detail drawer for clinical SOP actions", () => {
    const target: DashboardDetailTarget = { type: "metric", metricId: "actions" };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DashboardDetailDrawer
          target={target}
          onClose={() => {}}
          spots={mockSpots}
          outlooks={mockOutlooks}
        />
      </MemoryRouter>
    );

    expect(html).toContain("Clinical &amp; Municipal SOP Action Tracker");
    expect(html).toContain("Vector Control");
    expect(html).toContain("Prophylaxis Distribution");
  });
});
