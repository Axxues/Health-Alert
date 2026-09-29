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
}) {
  const isHigh = top && top.outlook.probability >= 0.5;

  return (
    <div
      className="card card--lift anim"
      style={{
        "--i": 5,
        position: "relative",
        overflow: "hidden",
        border: isHigh ? "1px solid var(--red-border)" : "1px solid var(--hairline)",
        background: isHigh
          ? "linear-gradient(180deg, rgba(244, 63, 94, 0.05) 0%, var(--card) 45%)"
          : "var(--card)",
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "15px" }}>
          {isHigh ? (
            <ShieldAlert size={18} strokeWidth={2.2} style={{ color: "var(--red)" }} />
          ) : (
            <AlertOctagon size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          )}
          <span>Priority Outbreak Threat</span>
        </h3>
        {top ? (
          <span
            className={`pill ${
              top.outlook.probability >= 0.6
                ? "pill--bad"
                : top.outlook.probability >= 0.3
                ? "pill--warn"
                : "pill--ok"
            }`}
            style={{ fontSize: "11px", fontWeight: 700 }}
          >
            {top.outlook.probability >= 0.6 && <span className="dot dot--pulse" />}
            {top.outlook.band} Risk
          </span>
        ) : (
          <span className="pill pill--ok" style={{ fontSize: "11px" }}>
            Baseline Normal
          </span>
        )}
      </div>

      {!top ? (
        <div style={{ padding: "16px 0", textAlign: "center", color: "var(--mute)" }}>
          <CheckCircle2 size={24} strokeWidth={2} style={{ color: "var(--green)", display: "inline-block", marginBottom: 6 }} />
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>Surveillance Baselines Steady</p>
          <small style={{ fontSize: "11.5px" }}>No anomalies surpassing early-warning threshold.</small>
        </div>
      ) : (
        <>
          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--card-subtle)", border: "1px solid var(--hairline)", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span style={{ fontSize: "11.5px", color: "var(--mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Active Focus
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
                  {diseaseName(top.disease)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Outbreak Probability</span>
                <span
                  className="tabular"
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: top.outlook.probability >= 0.6 ? "var(--red)" : "var(--amber)",
                    lineHeight: 1.1,
                  }}
                >
                  {Math.round(top.outlook.probability * 100)}%
                </span>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 6,
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
                  background:
                    top.outlook.probability >= 0.6
                      ? "linear-gradient(90deg, #f59e0b, #f43f5e)"
                      : "linear-gradient(90deg, #3b82f6, #f59e0b)",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {top.outlook.drivers.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "11.5px", color: "var(--mute)", fontWeight: 600, marginBottom: 8 }}>
                Key Environmental & Surveillance Signals:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {top.outlook.drivers.slice(0, 3).map((d) => (
                  <span
                    key={d}
                    className="pill pill--primary"
                    style={{ fontSize: "11px", padding: "3px 9px", background: "var(--primary-light)", border: "1px solid var(--primary-border)" }}
                  >
                    <Zap size={11} strokeWidth={2.5} />
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
              <Sparkles size={14} strokeWidth={2.2} />
              <span>Full Bi-LSTM Forecast</span>
            </Link>
            <Link
              className="btn-pill btn-pill--ghost"
              to="/playbooks"
              style={{ textDecoration: "none", fontSize: "12.5px", padding: "8px 12px", justifyContent: "center" }}
              title="View Emergency Response Protocols"
            >
              <span>Response SOP</span>
              <ArrowRight size={13} strokeWidth={2.2} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
