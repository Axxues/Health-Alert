import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  MapPin,
  TrendingUp,
  Layers,
  Shield,
  ArrowRight,
  Radio,
  FileSpreadsheet,
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
import { ResponseFeedCard } from "../components/ResponseFeedCard";

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
    listHotspots().then(setSpots).catch(() => setError("Could not load surveillance telemetry."));
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
      label: s.muni.length > 8 ? s.muni.slice(0, 8) : s.muni,
      value: sev(s),
      kind: sev(s) >= 3 ? "solid" : sev(s) === 2 ? "mint" : "hatch",
      tag: i === 0 && arr.length > 1 ? "Peak" : undefined,
      tip: `${s.muni} · ${s.disease} · ${s.level} risk`,
    }));

  const topDisease = [...DISEASES]
    .map((d) => ({ disease: d, outlook: outlooks[d] }))
    .filter((r) => r.outlook)
    .sort((a, b) => b.outlook.probability - a.outlook.probability)[0] ?? null;

  const sortedBarangays = [...spots].sort((a, b) => sev(b) - sev(a)).slice(0, 4);

  return (
    <div>
      {/* Executive Command Header */}
      <div className="dash-head anim" style={{ "--i": 0, marginBottom: 24 } as React.CSSProperties}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="live-badge" style={{ padding: "3px 10px", fontSize: "11.5px" }}>
              <Radio size={12} strokeWidth={2.5} className="spin-in" />
              <span>Sentinel Surveillance Grid · Active Telemetry</span>
            </span>
          </div>
          <h1 style={{ margin: "4px 0 6px" }}>Epidemiological Surveillance Command Center</h1>
          <p className="sub" style={{ fontSize: "14px" }}>
            Real-time multi-syndromic intelligence, outbreak forecasting & coordinated field response.
          </p>
        </div>
        <div className="dash-actions">
          <Link className="btn-pill" to="/forecast" style={{ textDecoration: "none" }}>
            <Sparkles size={15} strokeWidth={2.2} />
            <span>Run New Forecast</span>
          </Link>
          <Link className="btn-pill btn-pill--ghost" to="/reports" style={{ textDecoration: "none" }}>
            <FileSpreadsheet size={15} strokeWidth={2.2} />
            <span>Surveillance Reports</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* 4 Spacious KPI Telemetry Cards */}
      <StatCards
        stats={[
          { label: "Active Hotspots", value: spots.length, note: "+2 from last week", hero: true },
          { label: "High Risk Zones", value: high, note: "Immediate field visit" },
          { label: "Under Watch", value: med, note: "Sentinel monitoring" },
          { label: "Routine Surveillance", value: Math.max(0, spots.length - high - med), note: "Normal baseline" },
        ]}
      />

      {/* Spacious 2-Column Asymmetric Operations Layout */}
      <div className="dash-asym">
        {/* Left Column: Surveillance & Outbreak Forecasting (60%) */}
        <div className="dash-col">
          {/* Card 1: Outbreak Hotspot Severity Matrix & Priority Barangay Triage */}
          <div className="card card--lift anim" style={{ "--i": 4 } as React.CSSProperties}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "16px" }}>
                <Layers size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
                <span>Outbreak Hotspot Severity Matrix</span>
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="pill pill--primary" style={{ fontSize: "11px" }}>
                  7 Sentinel LGUs
                </span>
                <Link to="/risk-maps" style={{ fontSize: "12.5px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>Open Risk Map</span>
                  <ArrowRight size={13} strokeWidth={2.2} />
                </Link>
              </div>
            </div>
            <p className="sub" style={{ marginBottom: 16 }}>
              Barangays ranked by outbreak probability, environmental vector index, and epidemiological alerts.
            </p>

            {bars.length === 0 ? (
              <p className="muted" style={{ margin: "28px 0", textAlign: "center" }}>
                No hotspots reported. Surveillance baselines are normal.
              </p>
            ) : (
              <WeekBars bars={bars} />
            )}

            {/* Seamless Sub-Section: Priority Sentinel Barangays */}
            <div className="dash-divider" />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <MapPin size={16} strokeWidth={2.2} style={{ color: "var(--red)" }} />
                <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)" }}>
                  Priority Field Investigation Targets
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--mute)" }}>Top 4 Hotspots</span>
            </div>

            {sortedBarangays.length === 0 ? (
              <p className="muted" style={{ margin: "10px 0" }}>No urgent barangays flagged today.</p>
            ) : (
              <ul className="rows">
                {sortedBarangays.map((s) => (
                  <li key={`${s.muni}-${s.disease}`} style={{ padding: "10px 0" }}>
                    <div
                      className="glyph"
                      style={{
                        textTransform: "uppercase",
                        fontWeight: 700,
                        fontSize: "12px",
                        background: sev(s) >= 3 ? "var(--red-bg)" : "var(--primary-light)",
                        color: sev(s) >= 3 ? "var(--red)" : "var(--primary)",
                      }}
                    >
                      {s.disease.slice(0, 2)}
                    </div>
                    <div className="meta">
                      <p style={{ fontWeight: 600 }}>{s.muni}</p>
                      <small style={{ textTransform: "capitalize" }}>
                        {s.disease} surveillance vector · {s.level}
                      </small>
                    </div>
                    <span className="tail">{pill(sev(s))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card 2: 4-Disease Multi-Syndromic Outlook */}
          <div className="card card--lift anim" style={{ "--i": 5 } as React.CSSProperties}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "16px" }}>
                <TrendingUp size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
                <span>4-Disease Multi-Syndromic Outlook</span>
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="pill pill--info" style={{ fontSize: "11px" }}>
                  2–4 Week Horizon
                </span>
                <Link to="/forecast" style={{ fontSize: "12.5px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>Forecast Models</span>
                  <ArrowRight size={13} strokeWidth={2.2} />
                </Link>
              </div>
            </div>
            <p className="sub" style={{ marginBottom: 14 }}>
              Bi-LSTM neural network and ARGO epidemiological surveillance projections.
            </p>

            <div className="outlook-grid">
              {DISEASES.map((d) => {
                const p = outlooks[d]?.probability ?? 0;
                const pct = Math.round(p * 100);
                const isHighRisk = p >= 0.6;
                const isWarn = p >= 0.3 && p < 0.6;

                return (
                  <div key={d} className="outlook-item">
                    <div className="outlook-item-head">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "var(--radius-sm)",
                            background: isHighRisk ? "var(--red-bg)" : isWarn ? "var(--amber-bg)" : "var(--primary-light)",
                            color: isHighRisk ? "var(--red)" : isWarn ? "var(--amber)" : "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Shield size={16} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--ink)" }}>
                            {diseaseName(d)}
                          </div>
                          <small style={{ fontSize: "11.5px", color: "var(--mute)" }}>
                            {outlooks[d]?.band ?? "Baseline"} Surveillance Horizon
                          </small>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          className="tabular"
                          style={{
                            fontWeight: 800,
                            fontSize: "16px",
                            color: isHighRisk ? "var(--red)" : isWarn ? "var(--amber)" : "var(--ink)",
                          }}
                        >
                          {pct}%
                        </span>
                        {isHighRisk ? (
                          <span className="pill pill--bad" style={{ fontSize: "11px", gap: 4 }}>
                            <span className="dot dot--pulse" />
                            <span>Surge Alert</span>
                          </span>
                        ) : isWarn ? (
                          <span className="pill pill--warn" style={{ fontSize: "11px" }}>Watch</span>
                        ) : (
                          <span className="pill pill--ok" style={{ fontSize: "11px" }}>Normal</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Visualizer */}
                    <div className="outlook-bar">
                      <div
                        className="outlook-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: isHighRisk
                            ? "linear-gradient(90deg, #f59e0b, #f43f5e)"
                            : isWarn
                            ? "linear-gradient(90deg, #3b82f6, #f59e0b)"
                            : "linear-gradient(90deg, #10b981, #3b82f6)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Incident Response & Operational Stream (40%) */}
        <div className="dash-col">
          {/* Card 1: Priority Outbreak Threat (Act Now) */}
          <ActNowCard top={topDisease} />

          {/* Card 2: Response Feed (Segmented Active Alerts & Field SOP Playbooks) */}
          <ResponseFeedCard
            alerts={alerts}
            onAck={onAck}
            books={books}
            ran={ran}
            onRun={onRun}
          />
        </div>
      </div>
    </div>
  );
}
