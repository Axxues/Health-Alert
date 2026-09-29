import { useState } from "react";
import {
  TrendingUp,
  BrainCircuit,
  Target,
  ShieldCheck,
  Table as TableIcon,
  LineChart as ChartIcon,
  HelpCircle,
} from "lucide-react";
import type { TimelineWeek } from "@/services/forecast/types/forecast.types";

export interface PredictionGraphProps {
  timeline: TimelineWeek[];
  metrics: {
    modelName: string;
    accuracyRate: number;
    mape: number;
    r2Score: number;
    aucRoc: number;
    confidenceMethod: string;
  };
  diseaseName: string;
}

export interface ChartPoint {
  week: TimelineWeek;
  x: number;
  actualY: number | null;
  predY: number;
  ciLowerY: number;
  ciUpperY: number;
}

export function computeChartScales(timeline: TimelineWeek[], width = 800, height = 300) {
  const padLeft = 55;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const rawMax = Math.max(
    10,
    ...timeline.map((w) => Math.max(w.ciUpper, w.actualCases ?? 0, w.predictedCases))
  );
  const maxVal = Math.round(rawMax * 1.15);

  const stepX = timeline.length > 1 ? chartW / (timeline.length - 1) : chartW;

  const points: ChartPoint[] = timeline.map((w, i) => {
    const x = padLeft + i * stepX;
    const predY = padTop + chartH - (w.predictedCases / maxVal) * chartH;
    const actualY =
      w.actualCases !== null ? padTop + chartH - (w.actualCases / maxVal) * chartH : null;
    const ciUpperY = padTop + chartH - (w.ciUpper / maxVal) * chartH;
    const ciLowerY = padTop + chartH - (w.ciLower / maxVal) * chartH;

    return { week: w, x, actualY, predY, ciLowerY, ciUpperY };
  });

  // Confidence polygon points (top edge left-to-right, then bottom edge right-to-left)
  const topPoints = points.map((p) => `${p.x},${p.ciUpperY}`).join(" ");
  const bottomPoints = [...points].reverse().map((p) => `${p.x},${p.ciLowerY}`).join(" ");
  const confidencePolygon = `${topPoints} ${bottomPoints}`;

  // Actuals path
  const actualPoints = points.filter((p) => p.actualY !== null);
  const actualPath = actualPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.actualY}` : `${acc} L ${p.x} ${p.actualY}`;
  }, "");

  // Predictions path (connecting last actual point to all future points)
  const futurePoints = points.filter((p) => p.week.isFuture);
  const bridgePoint = actualPoints[actualPoints.length - 1] ?? futurePoints[0];
  const predPoints = bridgePoint ? [bridgePoint, ...futurePoints] : futurePoints;
  const predPath = predPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.predY}` : `${acc} L ${p.x} ${p.predY}`;
  }, "");

  const currentWeekIdx = timeline.findIndex((w) => !w.isFuture && timeline[timeline.indexOf(w) + 1]?.isFuture);
  const demarcationX = currentWeekIdx >= 0 ? points[currentWeekIdx]?.x : null;

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    chartW,
    chartH,
    maxVal,
    points,
    confidencePolygon,
    actualPath,
    predPath,
    demarcationX,
  };
}

export function PredictionGraph({ timeline, metrics, diseaseName }: PredictionGraphProps) {
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
  const [showTable, setShowTable] = useState(false);

  const scales = computeChartScales(timeline, 840, 320);

  // Grid tick marks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(scales.maxVal * pct),
    y: scales.padTop + scales.chartH - pct * scales.chartH,
  }));

  return (
    <div className="card" style={{ padding: "24px" }}>
      {/* Accuracy & Model Performance Scorecard */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <BrainCircuit size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0, fontSize: "16px" }}>Dual-Horizon Outbreak Prediction Trajectory</h3>
          </div>
          <p className="sub" style={{ fontSize: "13px" }}>
            Bi-LSTM and ARGO neural forecasting with 8-week historical clinical observation and 4-week projected horizon.
          </p>
        </div>

        <button
          type="button"
          className="btn-pill btn-pill--ghost"
          onClick={() => setShowTable(!showTable)}
          style={{ fontSize: "12.5px", padding: "6px 14px", gap: 6 }}
        >
          {showTable ? <ChartIcon size={14} /> : <TableIcon size={14} />}
          <span>{showTable ? "View Chart Canvas" : "View Tabular Audit"}</span>
        </button>
      </div>

      {/* Model Telemetry Metric Badges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          padding: "14px 18px",
          background: "var(--card-subtle)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-md)",
          marginBottom: 20,
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 4 }}>
            <Target size={13} style={{ color: "var(--green)" }} />
            <span>Forecast Accuracy</span>
          </span>
          <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--green)", marginTop: 2 }}>
            {metrics.accuracyRate}%
          </div>
          <small style={{ fontSize: "11px", color: "var(--mute)" }}>Valid vs. PIDSR actuals</small>
        </div>

        <div>
          <span style={{ fontSize: "11px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={13} style={{ color: "var(--primary)" }} />
            <span>Error Rate (MAPE)</span>
          </span>
          <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
            {metrics.mape}%
          </div>
          <small style={{ fontSize: "11px", color: "var(--mute)" }}>Mean Abs % Error</small>
        </div>

        <div>
          <span style={{ fontSize: "11px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={13} style={{ color: "var(--cyan)" }} />
            <span>Goodness of Fit (R²)</span>
          </span>
          <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
            {metrics.r2Score}
          </div>
          <small style={{ fontSize: "11px", color: "var(--mute)" }}>Correlation coefficient</small>
        </div>

        <div>
          <span style={{ fontSize: "11px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 4 }}>
            <BrainCircuit size={13} style={{ color: "var(--purple)" }} />
            <span>Architecture Engine</span>
          </span>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginTop: 4, lineHeight: 1.2 }}>
            {metrics.modelName}
          </div>
          <small style={{ fontSize: "11px", color: "var(--mute)" }}>{metrics.confidenceMethod}</small>
        </div>
      </div>

      {!showTable ? (
        <div style={{ position: "relative" }}>
          {/* SVG Canvas */}
          <div style={{ width: "100%", overflowX: "auto" }}>
            <svg
              viewBox={`0 0 ${scales.width} ${scales.height}`}
              style={{ width: "100%", height: "auto", minWidth: "680px", display: "block" }}
            >
              <defs>
                <linearGradient id="ciGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {/* Y Axis Grid Lines */}
              {yTicks.map((t) => (
                <g key={t.val}>
                  <line
                    x1={scales.padLeft}
                    y1={t.y}
                    x2={scales.width - scales.padRight}
                    y2={t.y}
                    stroke="var(--hairline)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={scales.padLeft - 10}
                    y={t.y + 4}
                    fill="var(--mute)"
                    fontSize="11"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {t.val}
                  </text>
                </g>
              ))}

              {/* 95% Confidence Interval Band */}
              <polygon points={scales.confidencePolygon} fill="url(#ciGradient)" />

              {/* Historical Demarcation Vertical Line */}
              {scales.demarcationX !== null && (
                <g>
                  <line
                    x1={scales.demarcationX}
                    y1={scales.padTop}
                    x2={scales.demarcationX}
                    y2={scales.height - scales.padBottom}
                    stroke="var(--amber)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={scales.demarcationX}
                    y={scales.padTop - 10}
                    fill="var(--amber)"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    Current Epidemic Week → Projections
                  </text>
                </g>
              )}

              {/* Historical Actuals Path (Solid) */}
              <path
                d={scales.actualPath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Forecast Predictions Path (Dashed) */}
              <path
                d={scales.predPath}
                fill="none"
                stroke="var(--amber)"
                strokeWidth="2.8"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {scales.points.map((p) => {
                const isHovered = activePoint?.week.weekNumber === p.week.weekNumber;
                return (
                  <g
                    key={p.week.weekNumber}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setActivePoint(p)}
                    onMouseLeave={() => setActivePoint(null)}
                  >
                    {/* Hover hotspot */}
                    <circle cx={p.x} cy={p.actualY ?? p.predY} r={16} fill="transparent" />

                    {/* Actual Circle */}
                    {p.actualY !== null && (
                      <circle
                        cx={p.x}
                        cy={p.actualY}
                        r={isHovered ? 6 : 4}
                        fill="var(--card)"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        style={{ transition: "all 0.15s ease" }}
                      />
                    )}

                    {/* Future Prediction Circle */}
                    {p.week.isFuture && (
                      <circle
                        cx={p.x}
                        cy={p.predY}
                        r={isHovered ? 6 : 4}
                        fill="var(--card)"
                        stroke="var(--amber)"
                        strokeWidth="2.5"
                        style={{ transition: "all 0.15s ease" }}
                      />
                    )}

                    {/* X Axis Label */}
                    <text
                      x={p.x}
                      y={scales.height - scales.padBottom + 20}
                      fill={p.week.isFuture ? "var(--amber)" : "var(--mute)"}
                      fontSize="11"
                      fontWeight={p.week.isFuture ? "700" : "500"}
                      textAnchor="middle"
                    >
                      {p.week.weekLabel.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Tooltip Popover */}
          {activePoint && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 20,
                background: "var(--card)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                boxShadow: "var(--shadow-md)",
                fontSize: "12px",
                lineHeight: 1.4,
                zIndex: 10,
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                {activePoint.week.weekLabel}
              </div>
              {activePoint.week.actualCases !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)" }}>
                  <span>Confirmed Actual Cases:</span>
                  <b className="tabular" style={{ fontSize: "14px" }}>{activePoint.week.actualCases}</b>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--amber)" }}>
                  <span>Projected Case Estimate:</span>
                  <b className="tabular" style={{ fontSize: "14px" }}>{activePoint.week.predictedCases}</b>
                </div>
              )}
              <div style={{ color: "var(--mute)", marginTop: 2 }}>
                95% CI Range: <span className="tabular">{activePoint.week.ciLower} – {activePoint.week.ciUpper}</span> cases
              </div>
            </div>
          )}

          {/* Chart Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              flexWrap: "wrap",
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--hairline)",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 18, height: 3.5, background: "var(--primary)", borderRadius: 2 }} />
              <span style={{ color: "var(--ink)" }}>Confirmed Weekly Actuals (PIDSR/ESU)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 18,
                  height: 3,
                  borderTop: "3px dashed var(--amber)",
                }}
              />
              <span style={{ color: "var(--ink)" }}>Bi-LSTM Forecast Trajectory</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 16,
                  height: 12,
                  background: "rgba(82, 93, 249, 0.15)",
                  border: "1px solid var(--primary-border)",
                  borderRadius: 2,
                }}
              />
              <span style={{ color: "var(--mute)" }}>95% Empirical Confidence Band</span>
            </div>
          </div>
        </div>
      ) : (
        /* Tabular Audit Table */
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline)", textAlign: "left", color: "var(--mute)" }}>
                <th style={{ padding: "10px 12px" }}>Epidemic Week</th>
                <th style={{ padding: "10px 12px" }}>Phase</th>
                <th style={{ padding: "10px 12px" }}>Confirmed Actuals</th>
                <th style={{ padding: "10px 12px" }}>Model Predicted</th>
                <th style={{ padding: "10px 12px" }}>95% Confidence Interval</th>
                <th style={{ padding: "10px 12px" }}>Variance / Residual</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((w) => {
                const diff =
                  w.actualCases !== null ? Math.round(w.actualCases - w.predictedCases) : null;

                return (
                  <tr
                    key={w.weekNumber}
                    style={{
                      borderBottom: "1px solid var(--hairline)",
                      background: w.isFuture ? "var(--backdrop)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink)" }}>
                      {w.weekLabel}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={`pill ${w.isFuture ? "pill--warn" : "pill--ok"}`} style={{ fontSize: "11px" }}>
                        {w.isFuture ? "Forecast" : "Actual"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700 }}>
                      {w.actualCases !== null ? w.actualCases : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "var(--primary)" }}>
                      {w.predictedCases}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "var(--mute)" }}>
                      [{w.ciLower}, {w.ciUpper}]
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>
                      {diff !== null ? (
                        <span style={{ color: Math.abs(diff) <= 3 ? "var(--green)" : "var(--amber)" }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : (
                        <span style={{ color: "var(--mute)" }}>Projected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
