import { Link } from "react-router";
import { AlertOctagon, ArrowRight, Zap } from "lucide-react";
import type { ForecastOutlook } from "@/services/forecast/types";

export function diseaseName(d: string) {
  return d === "ili" ? "Flu-like Illness (ILI)" : d.charAt(0).toUpperCase() + d.slice(1);
}

export function ActNowCard({
  top,
}: {
  top: { disease: string; outlook: ForecastOutlook } | null;
}) {
  return (
    <div
      className="card card--lift anim"
      style={{
        "--i": 5,
        position: "relative",
        overflow: "hidden",
        borderColor: top && top.outlook.probability >= 0.5 ? "var(--red-border)" : "var(--hairline)",
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
          <AlertOctagon size={18} strokeWidth={2.2} style={{ color: "var(--red)" }} />
          <span>Priority Outbreak Threat</span>
        </h3>
        {top && (
          <span
            className={`pill ${
              top.outlook.probability >= 0.6
                ? "pill--bad"
                : top.outlook.probability >= 0.3
                ? "pill--warn"
                : "pill--ok"
            }`}
          >
            {top.outlook.band}
          </span>
        )}
      </div>

      {!top ? (
        <p className="muted" style={{ margin: "14px 0" }}>
          No high-risk outlook detected. All monitored disease baselines are stable.
        </p>
      ) : (
        <>
          <div style={{ margin: "14px 0 10px" }}>
            <div style={{ fontSize: "12px", color: "var(--mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Highest Projected Risk
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
                {diseaseName(top.disease)}
              </span>
              <span
                className="tabular"
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: top.outlook.probability >= 0.6 ? "var(--red)" : "var(--amber)",
                }}
              >
                {Math.round(top.outlook.probability * 100)}%
              </span>
            </div>
          </div>

          {top.outlook.drivers.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: "11.5px", color: "var(--mute)", fontWeight: 600, marginBottom: 6 }}>
                Primary Environmental & Clinical Drivers:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {top.outlook.drivers.slice(0, 3).map((d) => (
                  <span key={d} className="pill pill--primary" style={{ fontSize: "11.5px" }}>
                    <Zap size={11} strokeWidth={2.5} />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Link
              className="btn-pill"
              to="/forecast"
              style={{ textDecoration: "none", fontSize: "13px", padding: "7px 14px", flex: 1 }}
            >
              <span>Examine Forecast</span>
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
