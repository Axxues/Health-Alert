import { useState } from "react";
import {
  TrendingUp,
  BrainCircuit,
  Target,
  ShieldCheck,
  Table as TableIcon,
  LineChart as ChartIcon,
} from "lucide-react";
import type { TimelineWeek } from "@/services/forecast/types/forecast.types";

export interface PredictionGraphProps {
  timeline: TimelineWeek[];
  metrics: {
    modelName: string;
    accuracyRate: number | null;
    mape: number | null;
    r2Score: number | null;
    aucRoc?: number | null;
    confidenceMethod: string;
  };
  diseaseName: string;
  selectedWeek: number | null;
  onSelectWeek: (weekNumber: number) => void;
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

export function PredictionGraph({ timeline, metrics, diseaseName, selectedWeek, onSelectWeek }: PredictionGraphProps) {
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
  const [showTable, setShowTable] = useState(false);

  const scales = computeChartScales(timeline, 840, 320);

  // Grid tick marks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(scales.maxVal * pct),
    y: scales.padTop + scales.chartH - pct * scales.chartH,
  }));

  return (
    <div className="section-card overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BrainCircuit size={16} strokeWidth={2.2} />
            </div>
            <h3 className="text-base font-semibold text-foreground tracking-tight m-0">
              Dual-Horizon {diseaseName} Outbreak Prediction Trajectory
            </h3>
          </div>
          <p className="text-xs text-muted-foreground m-0">
            Bi-LSTM and ARGO neural forecasting with 8-week historical clinical observation and 4-week projected horizon.
          </p>
        </div>

        <button
          type="button"
          className="btn-pill btn-pill--ghost text-xs px-3.5 py-1.5 gap-2"
          onClick={() => setShowTable(!showTable)}
        >
          {showTable ? <ChartIcon size={14} /> : <TableIcon size={14} />}
          <span>{showTable ? "View Chart Canvas" : "View Tabular Audit"}</span>
        </button>
      </div>

      <div className="p-6">
        {/* Model Telemetry Metric Badges - Cellwego border-l-4 archetype */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border border-l-4 border-l-emerald-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forecast Accuracy</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Target size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 tabular-nums">
              {metrics.accuracyRate !== null ? `${metrics.accuracyRate}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-0">Validated vs. PIDSR actuals</p>
          </div>

          <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Error Rate (MAPE)</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 tabular-nums">
              {metrics.mape !== null ? `${metrics.mape}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-0">Mean absolute percentage error</p>
          </div>

          <div className="bg-card border border-border border-l-4 border-l-indigo-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goodness of Fit (R²)</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 tabular-nums">
              {metrics.r2Score ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-0">Empirical correlation index</p>
          </div>

          <div className="bg-card border border-border border-l-4 border-l-purple-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Architecture</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <BrainCircuit size={16} />
              </div>
            </div>
            <div className="text-sm font-bold text-foreground mt-2 leading-tight">
              {metrics.modelName}
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-0">{metrics.confidenceMethod}</p>
          </div>
        </div>

        {!showTable ? (
          <div className="relative">
            {/* SVG Canvas */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${scales.width} ${scales.height}`}
                className="w-full h-auto min-w-[680px] block"
              >
                <defs>
                  <linearGradient id="ciGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
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

              {/* Selected-week indicator line */}
              {selectedWeek !== null &&
                scales.points
                  .filter((p) => p.week.weekNumber === selectedWeek)
                  .map((p) => (
                    <line
                      key={`sel-${p.week.weekNumber}`}
                      x1={p.x}
                      y1={scales.padTop}
                      x2={p.x}
                      y2={scales.height - scales.padBottom}
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      strokeDasharray="2 3"
                    />
                  ))}

              {/* Data Points */}
              {scales.points.map((p) => {
                const isHovered = activePoint?.week.weekNumber === p.week.weekNumber;
                const isSelected = selectedWeek === p.week.weekNumber;
                return (
                  <g
                    key={p.week.weekNumber}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setActivePoint(p)}
                    onMouseLeave={() => setActivePoint(null)}
                    onClick={() => onSelectWeek(p.week.weekNumber)}
                  >
                    {/* Hover hotspot */}
                    <circle cx={p.x} cy={p.actualY ?? p.predY} r={16} fill="transparent" />

                    {/* Selected halo */}
                    {isSelected && (
                      <circle
                        cx={p.x}
                        cy={p.actualY ?? p.predY}
                        r={10}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                    )}

                    {/* Actual Circle */}
                    {p.actualY !== null && (
                      <circle
                        cx={p.x}
                        cy={p.actualY}
                        r={isHovered || isSelected ? 6 : 4}
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
                        r={isHovered || isSelected ? 6 : 4}
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
                      fill={isSelected ? "var(--primary)" : p.week.isFuture ? "var(--amber)" : "var(--mute)"}
                      fontSize={isSelected ? "12" : "11"}
                      fontWeight={isSelected ? "800" : p.week.isFuture ? "700" : "500"}
                      textAnchor="middle"
                    >
                      {p.week.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Tooltip Popover */}
          {activePoint && (
            <div className="absolute top-3 right-5 bg-card border border-border rounded-lg p-3 shadow-lg text-xs leading-normal z-10 pointer-events-none">
              <div className="font-bold text-foreground mb-1">
                {activePoint.week.weekLabel}
              </div>
              {activePoint.week.actualCases !== null ? (
                <div className="flex items-center gap-1.5 text-primary">
                  <span>Confirmed Actual Cases:</span>
                  <b className="text-sm tabular-nums">{activePoint.week.actualCases}</b>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <span>Projected Case Estimate:</span>
                  <b className="text-sm tabular-nums">{activePoint.week.predictedCases}</b>
                </div>
              )}
              <div className="text-muted-foreground mt-0.5">
                95% CI Range: <span className="tabular-nums">{activePoint.week.ciLower} – {activePoint.week.ciUpper}</span> cases
              </div>
            </div>
          )}

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 flex-wrap mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-primary rounded" />
              <span className="text-foreground">Confirmed Actuals (PIDSR/ESU)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-0 border-t-2 border-dashed border-amber-500" />
              <span className="text-foreground">Bi-LSTM Forecast Trajectory</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xs" />
              <span>95% Empirical Confidence Band</span>
            </div>
          </div>
        </div>
      ) : (
        /* Tabular Audit Table */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Epidemic Week</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Phase</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Confirmed Actuals</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Model Predicted</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">95% Confidence Interval</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Variance / Residual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeline.map((w) => {
                const diff =
                  w.actualCases !== null ? Math.round(w.actualCases - w.predictedCases) : null;

                return (
                  <tr
                    key={w.weekNumber}
                    onClick={() => onSelectWeek(w.weekNumber)}
                    className={`transition-colors hover:bg-muted/30 cursor-pointer ${w.isFuture ? "bg-muted/10" : ""}`}
                    style={selectedWeek === w.weekNumber ? { outline: "2px solid var(--primary)", outlineOffset: -2 } : undefined}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {w.weekLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`pill ${w.isFuture ? "pill--warn" : "pill--ok"} text-[10px]`}>
                        {w.isFuture ? "Forecast" : "Actual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground tabular-nums">
                      {w.actualCases !== null ? w.actualCases : "—"}
                    </td>
                    <td className="px-4 py-3 text-primary font-medium tabular-nums">
                      {w.predictedCases}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      [{w.ciLower}, {w.ciUpper}]
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {diff !== null ? (
                        <span className={Math.abs(diff) <= 3 ? "text-emerald-500" : "text-amber-500"}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Projected</span>
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
    </div>
  );
}
