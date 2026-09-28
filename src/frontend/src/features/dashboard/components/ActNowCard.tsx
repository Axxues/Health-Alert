import { Link } from "react-router";
import type { ForecastOutlook } from "@/services/forecast/types";

export function diseaseName(d: string) {
  return d === "ili" ? "Flu-like illness" : d.charAt(0).toUpperCase() + d.slice(1);
}

// Highest-probability outlook with the reasons attached — the one thing to act on.
export function ActNowCard({ top }: { top: { disease: string; outlook: ForecastOutlook } | null }) {
  return (
    <div className="card card--lift anim" style={{ "--i": 5 } as React.CSSProperties}>
      <h3>Act now</h3>
      {!top ? (
        <p className="muted">No outlook yet. Run a forecast to get today's priority.</p>
      ) : (
        <>
          <p style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 2px", textTransform: "capitalize" }}>
            {diseaseName(top.disease)}{" "}
            <span className="tabular">{Math.round(top.outlook.probability * 100)}%</span>
          </p>
          <p style={{ margin: "0 0 10px" }}>
            <span className={`pill ${top.outlook.probability >= 0.6 ? "pill--bad" : top.outlook.probability >= 0.3 ? "pill--warn" : "pill--ok"}`}>
              {top.outlook.band}
            </span>
          </p>
          {top.outlook.drivers.length > 0 && (
            <ul className="rows" style={{ marginTop: 0 }}>
              {top.outlook.drivers.slice(0, 3).map((d) => (
                <li key={d}><span className="glyph" aria-hidden>→</span><div className="meta"><p>{d}</p></div></li>
              ))}
            </ul>
          )}
          <Link className="btn-pill" to="/forecast" style={{ textDecoration: "none", marginTop: 14 }}>Open forecast</Link>
        </>
      )}
    </div>
  );
}
