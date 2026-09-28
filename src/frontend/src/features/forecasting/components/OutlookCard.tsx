import type { ForecastOutlook } from "@/services/forecast/types";

const WORDS: Record<string, string> = {
  cases: "recent cases",
  temperature: "warm weather",
  rainfall: "recent rain",
  flood: "flooding",
  "search-trends": "more people searching symptoms",
  aqi: "poor air quality",
  "heat-index": "high heat",
};

export function OutlookCard({ outlook }: { outlook: ForecastOutlook | null }) {
  if (!outlook) return <p className="muted">Pick a disease to see its outlook.</p>;
  return (
    <div className="card">
      <p className="tabular" style={{ fontSize: 40, fontWeight: 300, margin: "0 0 4px" }}>
        {Math.round(outlook.probability * 100)}%
      </p>
      <p style={{ margin: "0 0 8px" }}>
        {outlook.band} — {outlook.drivers.map((d) => WORDS[d] ?? d).join(", ")} driving it.
      </p>
    </div>
  );
}
