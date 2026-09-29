import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  MapPin,
  TrendingUp,
  Layers,
  ArrowRight,
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
  if (sevN >= 3) return <span className="badge badge--destructive">High Risk</span>;
  if (sevN === 2) return <span className="badge badge--warning">Watch</span>;
  return <span className="badge badge--success">Routine</span>;
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
      <div className="dash-head anim" style={{ "--i": 0, marginBottom: 20 } as React.CSSProperties}>
        <div>
          <h1 style={{ margin: "4px 0 6px", fontSize: "26px", fontWeight: 800 }}>
            Epidemiological Surveillance Command Center
          </h1>
          <p className="sub" style={{ fontSize: "13.5px" }}>
            Real-time multi-syndromic intelligence, outbreak forecasting & coordinated field response across Region 1.
          </p>
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
        <div className="dash-col" style={{ display: "grid", gap: 20 }}>
          {/* Card 1: Outbreak Hotspot Severity Matrix */}
          <div className="section-card anim" style={{ "--i": 4 } as React.CSSProperties}>
            <div className="section-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={17} style={{ color: "var(--primary)" }} />
                <h3>Outbreak Hotspot Severity Matrix</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge--muted">7 Sentinels</span>
                <Link to="/risk-maps" style={{ fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)" }}>
                  <span>Open Risk Map</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="section-card-body">
              <p className="sub" style={{ margin: "0 0 16px", fontSize: "13px" }}>
                Barangays ranked by outbreak probability, environmental vector index, and epidemiological alerts.
              </p>

              {bars.length === 0 ? (
                <p className="muted" style={{ margin: "28px 0", textAlign: "center" }}>
                  No hotspots reported. Surveillance baselines are normal.
                </p>
              ) : (
                <WeekBars bars={bars} />
              )}

              {/* Priority Field Investigation Targets */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <MapPin size={15} style={{ color: "var(--red)" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      Priority Field Targets
                    </span>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--mute)" }}>Top 4 Hotspots</span>
                </div>

                {sortedBarangays.length === 0 ? (
                  <p className="muted" style={{ margin: "10px 0" }}>No urgent barangays flagged today.</p>
                ) : (
                  <ul className="rows">
                    {sortedBarangays.map((s) => (
                      <li key={`${s.muni}-${s.disease}`} style={{ padding: "8px 12px" }}>
                        <div
                          className="glyph"
                          style={{
                            textTransform: "uppercase",
                            fontWeight: 700,
                            fontSize: "11px",
                            background: sev(s) >= 3 ? "hsl(var(--destructive-raw) / 0.1)" : "hsl(var(--primary-raw) / 0.1)",
                            color: sev(s) >= 3 ? "var(--red)" : "var(--primary)",
                          }}
                        >
                          {s.disease.slice(0, 2)}
                        </div>
                        <div className="meta">
                          <p style={{ fontWeight: 600, fontSize: "13px" }}>{s.muni}</p>
                          <small style={{ textTransform: "capitalize", fontSize: "11.5px" }}>
                            {s.disease} surveillance vector · {s.level}
                          </small>
                        </div>
                        <span className="tail">{pill(sev(s))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: 4-Disease Multi-Syndromic Outlook */}
          <div className="section-card anim" style={{ "--i": 5 } as React.CSSProperties}>
            <div className="section-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={17} style={{ color: "var(--primary)" }} />
                <h3>4-Disease Multi-Syndromic Outlook</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge--info">2–4 Wk Horizon</span>
                <Link to="/forecast" style={{ fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)" }}>
                  <span>Forecast Matrix</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="section-card-body">
              <p className="sub" style={{ margin: "0 0 16px", fontSize: "13px" }}>
                Early warning surge probability models with environmental PAGASA covariates.
              </p>

              <div className="outlook-grid">
                {DISEASES.map((d) => {
                  const out = outlooks[d];
                  const prob = out?.probability ?? 0;
                  const pct = Math.round(prob * 100);
                  const isHigh = prob >= 0.7;
                  const isMed = prob >= 0.4 && prob < 0.7;

                  return (
                    <div key={d} className="outlook-item" style={{ background: "var(--card)", padding: "12px 14px", border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)" }}>
                      <div className="outlook-item-head">
                        <div>
                          <b style={{ textTransform: "capitalize", fontSize: "13.5px", color: "var(--ink)" }}>{diseaseName(d)}</b>
                          <small style={{ display: "block", color: "var(--mute)", fontSize: "11.5px" }}>
                            {out ? out.drivers.slice(0, 2).join(", ") || "Baseline steady" : "Loading telemetry…"}
                          </small>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            className="tabular"
                            style={{
                              fontWeight: 800,
                              fontSize: "14px",
                              color: isHigh ? "var(--red)" : isMed ? "var(--amber)" : "var(--green)",
                            }}
                          >
                            {pct}% Surge Prob.
                          </span>
                          <span className={`badge ${isHigh ? "badge--destructive" : isMed ? "badge--warning" : "badge--success"}`} style={{ display: "block", marginTop: 2, fontSize: "10px" }}>
                            {out?.band ?? "Routine"}
                          </span>
                        </div>
                      </div>

                      <div className="outlook-bar" style={{ height: 5, background: "var(--backdrop)", borderRadius: "var(--radius-pill)", overflow: "hidden", marginTop: 8 }}>
                        <div
                          className="outlook-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: isHigh ? "var(--red)" : isMed ? "var(--amber)" : "var(--green)",
                            height: "100%",
                            borderRadius: "var(--radius-pill)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Urgent Clinical Actions & Alerts Feed (40%) */}
        <div className="dash-col" style={{ display: "grid", gap: 20 }}>
          {/* Card 3: Top Outbreak Target Priority Alert */}
          <ActNowCard
            top={topDisease}
            books={books}
            ran={ran}
            onRun={onRun}
          />

          {/* Card 4: Recent Surveillance Signal Feed */}
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
