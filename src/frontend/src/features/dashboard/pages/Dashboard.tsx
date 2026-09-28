import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { getOutlook } from "@/services/forecast/api";
import { StatCards } from "../components/StatCards";
import { WeekBars, type Bar } from "../components/WeekBars";
import { ProgressRing } from "../components/ProgressRing";
import { ShiftTimer } from "../components/ShiftTimer";

const DISEASES = ["dengue", "leptospirosis", "ili", "asthma"] as const;

function sev(s: Hotspot) {
  if (/high/i.test(s.level)) return 3;
  if (/med|moderate/i.test(s.level)) return 2;
  return 1;
}

function pill(sevN: number) {
  if (sevN >= 3) return <span className="pill pill--bad">High</span>;
  if (sevN === 2) return <span className="pill pill--warn">Watch</span>;
  return <span className="pill pill--ok">Routine</span>;
}

export function Dashboard() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [probs, setProbs] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots().then(setSpots).catch(() => setError("Could not load the map. Try again."));
    Promise.all(DISEASES.map((d) => getOutlook({ disease: d }).then((o) => [d, o.probability] as const)))
      .then((rows) => setProbs(Object.fromEntries(rows)))
      .catch(() => {});
  }, []);

  const high = spots.filter((s) => sev(s) >= 3).length;
  const med = spots.filter((s) => sev(s) === 2).length;
  const action = spots.length === 0 ? 0 : Math.round(((high + med) / spots.length) * 100);

  const bars: Bar[] = [...spots]
    .sort((a, b) => sev(b) - sev(a))
    .slice(0, 7)
    .map((s, i, arr) => ({
      label: s.muni.length > 6 ? s.muni.slice(0, 6) : s.muni,
      value: sev(s),
      kind: sev(s) >= 3 ? "solid" : sev(s) === 2 ? "mint" : "hatch",
      tag: i === 0 && arr.length > 1 ? "peak" : undefined,
    }));

  const next = spots.find((s) => sev(s) >= 3) ?? spots[0];

  return (
    <div>
      <div className="dash-head anim" style={{ "--i": 0 } as React.CSSProperties}>
        <div>
          <h1>Dashboard</h1>
          <p className="sub">Plan today's visits, then work through them.</p>
        </div>
        <div className="dash-actions">
          <Link className="btn-pill" to="/forecast" style={{ textDecoration: "none" }}>+ Run forecast</Link>
          <Link className="btn-pill btn-pill--ghost" to="/alerts" style={{ textDecoration: "none" }}>Review alerts</Link>
        </div>
      </div>

      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      <StatCards
        stats={[
          { label: "Active hotspots", value: spots.length, note: "Live from the latest run", hero: true },
          { label: "High risk", value: high, note: "Visit this week" },
          { label: "Monitoring", value: med, note: "Watch for changes" },
          { label: "Low risk", value: spots.length - high - med, note: "Routine checks" },
        ]}
      />

      <div className="grid3">
        <div className="card card--lift anim" style={{ "--i": 4 } as React.CSSProperties}>
          <h3>Risk by place</h3>
          <p className="sub">Worst first, from the latest run.</p>
          {bars.length === 0
            ? <p className="muted">No hotspots right now. Check back after the next run.</p>
            : <WeekBars bars={bars} />}
        </div>
        <div className="card card--lift anim" style={{ "--i": 5 } as React.CSSProperties}>
          <h3>Next visit</h3>
          {next ? (
            <>
              <p style={{ fontSize: 17, fontWeight: 650, margin: "10px 0 2px" }}>{next.muni}</p>
              <p className="sub">{next.disease} · {next.level} risk · due this week</p>
              <Link className="btn-pill" to="/playbooks" style={{ textDecoration: "none", marginTop: 14 }}>▶ Open playbooks</Link>
            </>
          ) : <p className="muted">Nothing scheduled. New hotspots will land here.</p>}
        </div>
        <div className="card card--lift anim" style={{ "--i": 6 } as React.CSSProperties}>
          <h3>Hotspots needing action</h3>
          {spots.length === 0
            ? <p className="muted">The list fills in after the next run.</p>
            : (
              <ul className="rows">
                {[...spots].sort((a, b) => sev(b) - sev(a)).slice(0, 5).map((s) => (
                  <li key={`${s.muni}-${s.disease}`}>
                    <span className="glyph" aria-hidden>{s.disease.slice(0, 1).toUpperCase()}</span>
                    <div className="meta">
                      <p>{s.disease} · {s.muni}</p>
                      <small>Due this week</small>
                    </div>
                    <span className="tail">{pill(sev(s))}</span>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>

      <div className="grid3b">
        <div className="card card--lift anim" style={{ "--i": 7 } as React.CSSProperties}>
          <h3>Disease watch</h3>
          <p className="sub">Live outlook for the four tracked diseases.</p>
          <ul className="rows">
            {DISEASES.map((d) => {
              const p = probs[d] ?? 0;
              return (
                <li key={d}>
                  <span className="glyph" aria-hidden>{d.slice(0, 1).toUpperCase()}</span>
                  <div className="meta">
                    <p style={{ textTransform: "capitalize" }}>{d === "ili" ? "Flu-like illness" : d}</p>
                    <small className="tabular">{Math.round(p * 100)}% chance this week</small>
                  </div>
                  <span className="tail">
                    {p >= 0.6 ? <span className="pill pill--bad"><span className="dot dot--pulse" />Rising</span>
                      : p >= 0.3 ? <span className="pill pill--warn">Watch</span>
                        : <span className="pill pill--ok">Calm</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="card card--lift anim" style={{ "--i": 8 } as React.CSSProperties}>
          <h3>Share needing action</h3>
          <ProgressRing
            pct={action}
            label="Need action"
            legend={[
              { color: "var(--pine)", text: "Need action" },
              { color: "var(--hatch)", text: "Routine" },
            ]}
          />
        </div>
        <ShiftTimer />
      </div>
    </div>
  );
}
