import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EpidemicBarGraph } from "./EpidemicBarGraph";

describe("EpidemicBarGraph", () => {
  it("renders full-width card with title and subtitle", () => {
    const html = renderToStaticMarkup(<EpidemicBarGraph />);
    expect(html).toContain("Regional Epidemiological Curve");
    expect(html).toContain("Epi-Curve");
    expect(html).toContain("Confirmed case counts vs bi-LSTM projected surge envelope");
  });

  it("renders disease filter options", () => {
    const html = renderToStaticMarkup(<EpidemicBarGraph />);
    expect(html).toContain("All Syndromes");
    expect(html).toContain("Dengue");
    expect(html).toContain("Leptospirosis");
    expect(html).toContain("Flu-like (ILI)");
    expect(html).toContain("Asthma");
  });

  it("renders epidemiological weeks and projection marker", () => {
    const html = renderToStaticMarkup(<EpidemicBarGraph />);
    expect(html).toContain("W33");
    expect(html).toContain("W44");
    expect(html).toContain("bi-LSTM Projection Window");
    expect(html).toContain("Epidemic Alert Threshold");
  });
});
