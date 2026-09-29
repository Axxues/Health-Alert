import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  BellRing,
  MapPin,
  TrendingUp,
  Layers,
  Shield,
} from "lucide-react";
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
  if (sevN >= 3) return <span className="pill pill--bad">High Risk</span>;
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
      label: s.muni.length > 7 ? s.muni.slice(0, 7) : s.muni,
      value: sev(s),
      kind: sev(s) >= 3 ? "solid" : sev(s) === 2 ? "mint" : "hatch",
      tag: i === 0 && arr.length > 1 ? "Peak" : undefined,
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="live-badge">
              <span className="dot dot--pulse" />
              LGU Sentinel Command Center
            </span>
          </div>
          <h1>Epidemiological Surveillance Command Center</h1>
          <p className="sub">
            Real-time multi-syndromic intelligence, outbreak forecasting & coordinated field response.
          </p>
        </div>
        <div className="dash-actions">
          <Link className="btn-pill" to="/forecast" style={{ textDecoration: "none" }}>
            <Sparkles size={16} strokeWidth={2.2} />
            <span>Run New Forecast</span>
          </Link>
          <Link className="btn-pill btn-pill--ghost" to="/alerts" style={{ textDecoration: "none" }}>
            <BellRing size={16} strokeWidth={2.2} />
            <span>Review Alerts</span>
          </Link>
        </div>
      </div>

      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      <StatCards
        stats={[
          { label: "Active Hotspots", value: spots.length, note: "+2 from last week", hero: true },
          { label: "High Risk Zones", value: high, note: "Immediate field visit" },
          { label: "Under Watch", value: med, note: "Sentinel monitoring" },
          { label: "Routine Surveillance", value: Math.max(0, spots.length - high - med), note: "Normal baseline" },
        ]}
      />

      <div className="grid3">
        <div className="card card--lift anim" style={{ "--i": 4 } as React.CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
              <Layers size={17} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
              <span>Hotspot Severity Ranking</span>
            </h3>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              7 Key LGUs
            </span>
          </div>
          <p className="sub">Barangays ranked by outbreak probability from recent models.</p>
          {bars.length === 0 ? (
            <p className="muted" style={{ margin: "20px 0" }}>No hotspots reported. Surveillance normal.</p>
          ) : (
            <WeekBars bars={bars} />
          )}
        </div>

        <ActNowCard top={topDisease} />

        <div className="card card--lift anim" style={{ "--i": 6 } as React.CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
              <MapPin size={17} strokeWidth={2.2} style={{ color: "var(--red)" }} />
              <span>High Priority Barangays</span>
            </h3>
            <Link to="/risk-maps" style={{ fontSize: "12px", fontWeight: 600 }}>
              Open map →
            </Link>
          </div>
          <p className="sub">Field teams assigned for rapid epidemiological investigation.</p>
          {spots.length === 0 ? (
            <p className="muted" style={{ margin: "20px 0" }}>No urgent barangays flagged today.</p>
          ) : (
            <ul className="rows">
              {[...spots].sort((a, b) => sev(b) - sev(a)).slice(0, 5).map((s) => (
                <li key={`${s.muni}-${s.disease}`}>
                  <div className="glyph" style={{ textTransform: "uppercase" }}>
                    {s.disease.slice(0, 2)}
                  </div>
                  <div className="meta">
                    <p>{s.muni}</p>
                    <small style={{ textTransform: "capitalize" }}>{s.disease} surveillance</small>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
              <TrendingUp size={17} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
              <span>4-Disease Outlook</span>
            </h3>
            <span className="pill pill--info" style={{ fontSize: "11px" }}>
              2-4 Wk Horizon
            </span>
          </div>
          <p className="sub">Bi-LSTM and ARGO model projections for monitored syndromes.</p>
          <ul className="rows">
            {DISEASES.map((d) => {
              const p = outlooks[d]?.probability ?? 0;
              return (
                <li key={d}>
                  <div className="glyph">
                    <Shield size={16} strokeWidth={2.2} />
                  </div>
                  <div className="meta">
                    <p>{diseaseName(d)}</p>
                    <small className="tabular">{Math.round(p * 100)}% outbreak risk</small>
                  </div>
                  <span className="tail">
                    {p >= 0.6 ? (
                      <span className="pill pill--bad">
                        <span className="dot dot--pulse" />
                        Surge
                      </span>
                    ) : p >= 0.3 ? (
                      <span className="pill pill--warn">Watch</span>
                    ) : (
                      <span className="pill pill--ok">Normal</span>
                    )}
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
