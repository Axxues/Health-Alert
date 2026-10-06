import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";

export interface EpiWeek {
  week: string; // e.g. "W33"
  dates: string; // e.g. "Aug 11-17"
  cases: number;
  projected: boolean;
  threshold: number;
  ciLower?: number;
  ciUpper?: number;
}

type DiseaseVector = "all" | "dengue" | "leptospirosis" | "ili" | "asthma";

const DISEASE_OPTIONS: { id: DiseaseVector; label: string }[] = [
  { id: "all", label: "All Syndromes" },
  { id: "dengue", label: "Dengue" },
  { id: "leptospirosis", label: "Leptospirosis" },
  { id: "ili", label: "Flu-like (ILI)" },
  { id: "asthma", label: "Asthma" },
];

const WEEKS_METADATA = [
  { week: "W33", dates: "Aug 11-17", projected: false },
  { week: "W34", dates: "Aug 18-24", projected: false },
  { week: "W35", dates: "Aug 25-31", projected: false },
  { week: "W36", dates: "Sep 01-07", projected: false },
  { week: "W37", dates: "Sep 08-14", projected: false },
  { week: "W38", dates: "Sep 15-21", projected: false },
  { week: "W39", dates: "Sep 22-28", projected: false },
  { week: "W40", dates: "Sep 29-Oct 05", projected: false },
  { week: "W41", dates: "Oct 06-12", projected: true },
  { week: "W42", dates: "Oct 13-19", projected: true },
  { week: "W43", dates: "Oct 20-26", projected: true },
  { week: "W44", dates: "Oct 27-Nov 02", projected: true },
];

const DISEASE_DATA: Record<
  Exclude<DiseaseVector, "all">,
  { cases: number[]; threshold: number }
> = {
  dengue: {
    cases: [42, 48, 55, 62, 78, 89, 102, 118, 134, 142, 138, 126],
    threshold: 95,
  },
  leptospirosis: {
    cases: [8, 10, 12, 14, 25, 34, 38, 29, 24, 20, 16, 12],
    threshold: 22,
  },
  ili: {
    cases: [54, 58, 62, 70, 75, 82, 88, 95, 102, 108, 112, 105],
    threshold: 85,
  },
  asthma: {
    cases: [22, 24, 23, 26, 28, 32, 35, 38, 41, 44, 42, 39],
    threshold: 34,
  },
};

export function EpidemicBarGraph() {
  const [selectedDisease, setSelectedDisease] = useState<DiseaseVector>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute 12-week dataset for current disease selection
  const timeline: EpiWeek[] = useMemo(() => {
    if (selectedDisease === "all") {
      const allThreshold =
        DISEASE_DATA.dengue.threshold +
        DISEASE_DATA.leptospirosis.threshold +
        DISEASE_DATA.ili.threshold +
        DISEASE_DATA.asthma.threshold;

      return WEEKS_METADATA.map((meta, i) => {
        const sumCases =
          DISEASE_DATA.dengue.cases[i] +
          DISEASE_DATA.leptospirosis.cases[i] +
          DISEASE_DATA.ili.cases[i] +
          DISEASE_DATA.asthma.cases[i];

        return {
          week: meta.week,
          dates: meta.dates,
          projected: meta.projected,
          threshold: allThreshold,
          cases: sumCases,
          ciLower: meta.projected ? Math.round(sumCases * 0.9) : undefined,
          ciUpper: meta.projected ? Math.round(sumCases * 1.12) : undefined,
        };
      });
    }

    const { cases, threshold } = DISEASE_DATA[selectedDisease];
    return WEEKS_METADATA.map((meta, i) => {
      const c = cases[i];
      return {
        week: meta.week,
        dates: meta.dates,
        projected: meta.projected,
        threshold,
        cases: c,
        ciLower: meta.projected ? Math.round(c * 0.88) : undefined,
        ciUpper: meta.projected ? Math.round(c * 1.15) : undefined,
      };
    });
  }, [selectedDisease]);

  const maxVal = useMemo(() => {
    const rawMax = Math.max(
      ...timeline.map((w) => Math.max(w.cases, w.threshold, w.ciUpper ?? 0))
    );
    return Math.ceil((rawMax * 1.2) / 20) * 20;
  }, [timeline]);

  // Key summaries
  const peakWeek = useMemo(() => {
    return [...timeline].sort((a, b) => b.cases - a.cases)[0];
  }, [timeline]);

  const latestObserved = timeline[7]; // W40
  const firstProjected = timeline[8]; // W41
  const projectedChange =
    latestObserved && firstProjected
      ? Math.round(
          ((firstProjected.cases - latestObserved.cases) / latestObserved.cases) *
            100
        )
      : 0;

  const activeWeek = hoveredIdx !== null ? timeline[hoveredIdx] : timeline[timeline.length - 1];

  // SVG Chart Geometry
  const svgWidth = 1000;
  const svgHeight = 250;
  const chartPadLeft = 55;
  const chartPadRight = 25;
  const chartPadTop = 30;
  const chartPadBottom = 50;

  const chartW = svgWidth - chartPadLeft - chartPadRight;
  const chartH = svgHeight - chartPadTop - chartPadBottom;

  const stepX = chartW / timeline.length;
  const barWidth = Math.min(48, stepX * 0.72);

  // Threshold Y
  const thresholdVal = timeline[0]?.threshold ?? 100;
  const thresholdY = chartPadTop + chartH - (thresholdVal / maxVal) * chartH;

  // Split divider position between W40 (idx 7) and W41 (idx 8)
  const dividerX = chartPadLeft + 8 * stepX - stepX * 0.15;

  return (
    <Card className="w-full overflow-hidden shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">
                Regional Epidemiological Curve (Epi-Curve)
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                12-Week Horizon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confirmed case counts vs bi-LSTM projected surge envelope across Region I surveillance nodes
            </p>
          </div>

          {/* Disease filter button pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {DISEASE_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedDisease(d.id);
                  setHoveredIdx(null);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  selectedDisease === d.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* KPI Strip & Active Inspector Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-muted/30 border border-border/60 p-3">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              Peak Surveillance Week
            </span>
            <span className="font-mono font-extrabold text-foreground text-sm tabular-nums">
              {peakWeek.week} ({peakWeek.cases} cases)
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              Epi Alert Threshold
            </span>
            <span className="font-mono font-extrabold text-destructive text-sm tabular-nums">
              {thresholdVal} cases / week
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              bi-LSTM Surge Delta
            </span>
            <span
              className={`inline-flex items-center font-mono font-extrabold text-sm tabular-nums ${
                projectedChange > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {projectedChange > 0 ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingDown size={14} className="mr-1" />
              )}
              {projectedChange > 0 ? `+${projectedChange}%` : `${projectedChange}%`} WoW
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">
              Inspecting Week
            </span>
            <span className="font-mono font-bold text-foreground text-sm tabular-nums flex items-center gap-1.5">
              <span>{activeWeek.week}</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({activeWeek.dates})
              </span>
              {activeWeek.projected && (
                <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </span>
          </div>
        </div>

        {/* SVG Responsive Bar Graph Canvas */}
        <div className="w-full overflow-x-auto select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[700px] overflow-visible"
            role="img"
            aria-label="Epidemiological 12-week bar graph"
          >
            <defs>
              {/* Pattern for projected forecast bars */}
              <pattern
                id="forecast-hatch"
                width="8"
                height="8"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-violet-500/70 dark:text-violet-400/70"
                />
              </pattern>

              {/* Linear gradient for confirmed bars */}
              <linearGradient id="confirmed-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>

              {/* Linear gradient for alert bars (exceeding threshold) */}
              <linearGradient id="alert-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>

            {/* Background Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartPadTop + chartH - ratio * chartH;
              const val = Math.round(ratio * maxVal);
              return (
                <g key={ratio}>
                  <line
                    x1={chartPadLeft}
                    y1={y}
                    x2={chartPadLeft + chartW}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-border/40"
                  />
                  <text
                    x={chartPadLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] font-mono tabular-nums"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Epidemic Threshold Reference Line */}
            <g>
              <line
                x1={chartPadLeft}
                y1={thresholdY}
                x2={chartPadLeft + chartW}
                y2={thresholdY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={chartPadLeft + chartW}
                y={thresholdY - 6}
                textAnchor="end"
                className="fill-rose-500 font-bold text-[10px] font-mono uppercase tracking-wider"
              >
                Epidemic Alert Threshold ({thresholdVal})
              </text>
            </g>

            {/* Vertical Projection Split Divider */}
            <g>
              <line
                x1={dividerX}
                y1={chartPadTop - 8}
                x2={dividerX}
                y2={chartPadTop + chartH}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="text-border"
              />
              <rect
                x={dividerX + 8}
                y={chartPadTop - 18}
                width={160}
                height={18}
                rx={4}
                className="fill-violet-500/10 dark:fill-violet-500/20"
              />
              <text
                x={dividerX + 14}
                y={chartPadTop - 5}
                className="fill-violet-600 dark:fill-violet-300 font-mono text-[9px] font-bold uppercase tracking-wider"
              >
                bi-LSTM Projection Window
              </text>
            </g>

            {/* 12 Weekly Bars */}
            {timeline.map((w, idx) => {
              const barH = Math.max(4, (w.cases / maxVal) * chartH);
              const x = chartPadLeft + idx * stepX + (stepX - barWidth) / 2;
              const y = chartPadTop + chartH - barH;
              const isAlert = w.cases >= w.threshold;
              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={w.week}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Subtle hover background column highlight */}
                  {isHovered && (
                    <rect
                      x={chartPadLeft + idx * stepX}
                      y={chartPadTop}
                      width={stepX}
                      height={chartH}
                      rx={4}
                      className="fill-muted/40 transition-colors"
                    />
                  )}

                  {/* Confidence interval bracket for projected weeks */}
                  {w.projected && w.ciUpper && w.ciLower && (
                    <g opacity={isHovered ? 1 : 0.6}>
                      <line
                        x1={x + barWidth / 2}
                        y1={chartPadTop + chartH - (w.ciUpper / maxVal) * chartH}
                        x2={x + barWidth / 2}
                        y2={chartPadTop + chartH - (w.ciLower / maxVal) * chartH}
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={x + barWidth / 2 - 4}
                        y1={chartPadTop + chartH - (w.ciUpper / maxVal) * chartH}
                        x2={x + barWidth / 2 + 4}
                        y2={chartPadTop + chartH - (w.ciUpper / maxVal) * chartH}
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={x + barWidth / 2 - 4}
                        y1={chartPadTop + chartH - (w.ciLower / maxVal) * chartH}
                        x2={x + barWidth / 2 + 4}
                        y2={chartPadTop + chartH - (w.ciLower / maxVal) * chartH}
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}

                  {/* Bar element */}
                  {w.projected ? (
                    <>
                      {/* Projected base with diagonal hatch */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx={4}
                        fill="url(#forecast-hatch)"
                        stroke="#8b5cf6"
                        strokeWidth={isHovered ? "2" : "1.5"}
                        className="transition-all duration-200"
                      />
                      {/* Top cap for projection */}
                      <line
                        x1={x}
                        y1={y}
                        x2={x + barWidth}
                        y2={y}
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    /* Confirmed observed bar */
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={4}
                      fill={isAlert ? "url(#alert-bar)" : "url(#confirmed-bar)"}
                      opacity={isHovered ? 1 : 0.88}
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Value label above bar */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className={`font-mono text-[10px] font-bold tabular-nums transition-all ${
                      isHovered
                        ? "fill-foreground font-extrabold text-[11px]"
                        : "fill-muted-foreground"
                    }`}
                  >
                    {w.cases}
                  </text>

                  {/* Week label below bar */}
                  <text
                    x={x + barWidth / 2}
                    y={chartPadTop + chartH + 18}
                    textAnchor="middle"
                    className={`font-mono text-[11px] tabular-nums font-bold ${
                      isHovered ? "fill-primary" : "fill-foreground"
                    }`}
                  >
                    {w.week}
                  </text>

                  {/* Date range label below week */}
                  <text
                    x={x + barWidth / 2}
                    y={chartPadTop + chartH + 32}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {w.dates}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend & Telemetry Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-blue-600" />
              <span>Confirmed PIDSR/EDCS Observed Cases</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs border border-violet-500 bg-violet-500/30" />
              <span>bi-LSTM Projected Surge Envelope (95% CI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-red-500" />
              <span>Seasonal Outbreak Alert Threshold</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles size={13} className="text-violet-500" />
            <span>Walk-forward bi-LSTM model updated daily</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
