import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { getOutlook } from "@/services/forecast/api";
import type { ForecastOutlook } from "@/services/forecast/types";
import { listAlerts, ackAlert } from "@/services/alerts/api";
import type { HealthAlert } from "@/services/alerts/types";
import { listPlaybooks, executePlaybook } from "@/services/playbook/api";
import type { Playbook } from "@/services/playbook/types";
import { StatCards } from "../components/StatCards";
import { WeekBars, type Bar } from "../components/WeekBars";
import { ActNowCard, diseaseName } from "../components/ActNowCard";
import { AlertsCard } from "../components/AlertsCard";
import { PlaybooksCard } from "../components/PlaybooksCard";

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
  const [outlooks, setOutlooks] = useState<Record<string, ForecastOutlook>>({});
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [books, setBooks] = useState<Playbook[]>([]);
  const [ran, setRan] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots().then(setSpots).catch(() => setError("Could not load the map. Try again."));
    Promise.all(DISEASES.map((d) => getOutlook({ disease: d }).then((o) => [d, o] as const)))
      .then((rows) => setOutlooks(Object.fromEntries(rows)))
      .catch(() => {});
    listAlerts().then(setAlerts).catch(() => {});
    listPlaybooks().then(setBooks).catch(() => {});
  }, []);

  async function onAck(id: number) {
    await ackAlert(id).catch(() => null);
    setAlerts((list) => list.filter((a) => a.id !== id));
  }

  async function onRun(id: number) {
    await executePlaybook(id).catch(() => null);
    setRan((prev) => new Set(prev).add(id));
  }

  const high = spots.filter((s) => sev(s) >= 3).length;
  const med = spots.filter((s) => sev(s) === 2).length;

  const bars: Bar[] = [...spots]
    .sort((a, b) => sev(b) - sev(a))
    .slice(0, 7)
    .map((s, i, arr) => ({
      label: s.muni.length > 6 ? s.muni.slice(0, 6) : s.muni,
      value: sev(s),
      kind: sev(s) >= 3 ? "solid" : sev(s) === 2 ? "mint" : "hatch",
      tag: i === 0 && arr.length > 1 ? "peak" : undefined,
      tip: `${s.muni} · ${s.disease} · ${s.level} risk`,
    }));

  const topDisease = [...DISEASES]
    .map((d) => ({ disease: d, outlook: outlooks[d] }))
    .filter((r) => r.outlook)
    .sort((a, b) => b.outlook.probability - a.outlook.probability)[0] ?? null;

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
        <ActNowCard top={topDisease} />
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
              const p = outlooks[d]?.probability ?? 0;
              return (
                <li key={d}>
                  <span className="glyph" aria-hidden>{d.slice(0, 1).toUpperCase()}</span>
                  <div className="meta">
                    <p>{diseaseName(d)}</p>
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
        <AlertsCard alerts={alerts} onAck={onAck} />
        <PlaybooksCard books={books} ran={ran} onRun={onRun} />
      </div>
    </div>
  );
}
