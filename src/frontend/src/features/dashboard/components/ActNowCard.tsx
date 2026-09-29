import { Link } from "react-router";
import { AlertOctagon, ArrowRight, Zap, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import type { ForecastOutlook } from "@/services/forecast/types";

export function diseaseName(d: string) {
  return d === "ili" ? "Flu-like Illness (ILI)" : d.charAt(0).toUpperCase() + d.slice(1);
}

export function ActNowCard({
  top,
}: {
  top: { disease: string; outlook: ForecastOutlook } | null;
  books?: any[];
  ran?: Set<number>;
  onRun?: (id: number) => void;
}) {
  const isHigh = top && top.outlook.probability >= 0.5;

  return (
    <div className={`section-card anim ${isHigh ? "border-l-destructive" : "border-l-primary"}`} style={{ "--i": 5 } as React.CSSProperties}>
      <div className="section-card-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isHigh ? (
            <ShieldAlert size={17} style={{ color: "var(--red)" }} />
          ) : (
            <AlertOctagon size={17} style={{ color: "var(--primary)" }} />
          )}
          <h3>Priority Outbreak Threat</h3>
        </div>

        {top ? (
          <span
            className={`badge ${
              top.outlook.probability >= 0.6
                ? "badge--destructive"
                : top.outlook.probability >= 0.3
                ? "badge--warning"
                : "badge--success"
            }`}
            style={{ fontSize: "11px" }}
          >
            {top.outlook.band} Risk
          </span>
        ) : (
          <span className="badge badge--success" style={{ fontSize: "11px" }}>
            Routine
          </span>
        )}
      </div>

      <div className="section-card-body">
        {!top ? (
          <div style={{ padding: "16px 0", textAlign: "center", color: "var(--mute)" }}>
            <CheckCircle2 size={24} style={{ color: "var(--green)", display: "inline-block", marginBottom: 6 }} />
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>Surveillance Baselines Steady</p>
            <small style={{ fontSize: "11.5px" }}>No anomalies surpassing early-warning threshold.</small>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--card-subtle)", border: "1px solid var(--hairline)", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Active Sentinel Focus
                  </span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
                    {diseaseName(top.disease)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Surge Probability</span>
                  <span
                    className="tabular"
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: top.outlook.probability >= 0.6 ? "var(--red)" : "var(--amber)",
                      lineHeight: 1.1,
                    }}
                  >
                    {Math.round(top.outlook.probability * 100)}%
                  </span>
                </div>
              </div>

              {/* Clean Probability Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: 5,
                  background: "var(--backdrop)",
                  borderRadius: "var(--radius-pill)",
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    width: `${Math.round(top.outlook.probability * 100)}%`,
                    height: "100%",
                    borderRadius: "var(--radius-pill)",
                    background: top.outlook.probability >= 0.6 ? "var(--red)" : "var(--amber)",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>

            {top.outlook.drivers.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "11.5px", color: "var(--mute)", fontWeight: 600, marginBottom: 8 }}>
                  Environmental Signals & Drivers:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {top.outlook.drivers.slice(0, 3).map((d) => (
                    <span
                      key={d}
                      className="badge badge--muted"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                    >
                      <Zap size={11} style={{ marginRight: 3, color: "var(--amber)" }} />
                      <span>{d}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Link
                className="btn-pill"
                to="/forecast"
                style={{ textDecoration: "none", fontSize: "12.5px", padding: "8px 14px", flex: 1, justifyContent: "center" }}
              >
                <Sparkles size={14} />
                <span>Examine Trajectory</span>
              </Link>
              <Link
                className="btn-pill btn-pill--ghost"
                to="/playbooks"
                style={{ textDecoration: "none", fontSize: "12.5px", padding: "8px 12px", justifyContent: "center" }}
                title="View Emergency Response Protocols"
              >
                <span>SOP</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
