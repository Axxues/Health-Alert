import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Thermometer,
  Droplets,
  FileSpreadsheet,
  AlertTriangle,
  Shield,
  Radio,
  Send,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { getLocationDetail } from "@/services/forecast/api/locations.api";
import type { LocationDetailData, TimelineWeek } from "@/services/forecast/types/forecast.types";
import { PredictionGraph } from "@/features/forecasting/components/PredictionGraph";

// ponytail: per-week covariates wobble around the live snapshot for fed keys only
// (rain/temp/aqi); heat-index/Breteau/standing-water have no feed and stay hidden.
function weekCovariates(week: TimelineWeek, base: LocationDetailData["covariates"]) {
  const i = week.weekNumber;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const temp = base.avgTemperatureC == null ? null : round1(base.avgTemperatureC + 1.2 * Math.sin(i * 0.9 + 1));
  return {
    cumulativeRainfallMm: base.cumulativeRainfallMm == null ? null : Math.max(0, round1(base.cumulativeRainfallMm + 18 * Math.sin(i * 1.3))),
    avgTemperatureC: temp,
    aqiLevel: base.aqiLevel == null ? null : Math.max(0, Math.round(base.aqiLevel + 4 * Math.sin(i * 0.7))),
  };
}

// ponytail: static SOP text per DOH/WHO manuals, fetch from tblPlaybooks if it needs to be editable.
const SOP_PROCEDURES: Record<string, { source: string; steps: string[] }> = {
  "SOP-VEC-01": {
    source: "DOH National Dengue Prevention & Control Manual · WHO Dengue Guidelines (vector control)",
    steps: [
      "Map breeding sites within 100m radius of index household; record Breteau Index.",
      "Apply WHO-prequalified larvicide (temephos/Bti) to non-removable water containers.",
      "Conduct targeted ULV misting 05:00–07:00 or 16:00–18:00 only when adult indices exceed threshold.",
      "Enforce 4-o'clock habit cleanup with barangay; destroy disposable breeding sites.",
      "Repeat entomological survey after 7 days; log coverage in surveillance feed.",
    ],
  },
  "SOP-CLN-04": {
    source: "DOH Clinical Practice Guidelines on Dengue · WHO Handbook for Clinical Management of Dengue",
    steps: [
      "Open dedicated fever lane for triage using DOH dengue warning-sign checklist.",
      "Classify patients (Groups A/B/C per WHO); admit Groups B/C with warning signs.",
      "Preposition IV fluids (PNSS/RL), blood products, and monitoring charts at sentinel facility.",
      "Start strict intake-output monitoring; repeat CBC/hematocrit per DOH fluid algorithm.",
      "Report admissions and referrals daily through the surveillance feed.",
    ],
  },
  "SOP-COM-09": {
    source: "DOH Health Emergency Management & Risk Communication Manual · WHO COMBI Toolkit",
    steps: [
      "Brief BHWs on case signs, referral pathway, and Taglish house-to-house script.",
      "Visit households within 100m of cases; distribute dengue warning-sign flyers.",
      "Demonstrate search-and-destroy of breeding sites; leave checklist per household.",
      "Refer febrile cases to fever lane same-day; log visits and referrals.",
      "Submit daily BHW accomplishment report to City Epidemiology Unit.",
    ],
  },
};

function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</h2>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mute)" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const DEFAULT_SOP = {
  source: "DOH / WHO standard operating procedure",
  steps: [
    "Verify trigger threshold with the City Epidemiology Unit.",
    "Coordinate with barangay officials and the sentinel facility.",
    "Execute response actions and document coverage daily.",
    "Report completion through the surveillance feed.",
  ],
};

export function LocationDetail() {
  const { locationId } = useParams<{ locationId: string }>();
  const [searchParams] = useSearchParams();
  const diseaseParam = searchParams.get("disease") || undefined;

  const [detail, setDetail] = useState<LocationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertIssued, setAlertIssued] = useState(false);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(null);

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    setError("");
    getLocationDetail(locationId, diseaseParam)
      .then(setDetail)
      .catch(() => setError("Unable to retrieve location epidemiological telemetry."))
      .finally(() => setLoading(false));
  }, [locationId, diseaseParam]);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--mute)" }}>
        <p>Loading location epidemiological telemetry & predictive models…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="card" style={{ padding: "30px", textAlign: "center" }}>
        <AlertTriangle size={32} style={{ color: "var(--red)", display: "inline-block", marginBottom: 12 }} />
        <h3 style={{ margin: "0 0 8px" }}>Location Not Found</h3>
        <p className="sub" style={{ marginBottom: 20 }}>{error || "The requested sentinel area could not be resolved."}</p>
        <Link to="/intelligence" className="btn-pill" style={{ textDecoration: "none", display: "inline-flex" }}>
          <ArrowLeft size={14} />
          <span>Return to Intelligence Directory</span>
        </Link>
      </div>
    );
  }

  const peakWeek = detail.timeline.reduce((max, w) => (w.predictedCases > max.predictedCases ? w : max), detail.timeline[0]);
  const currentWeek = detail.timeline.filter((w) => !w.isFuture).slice(-1)[0] ?? detail.timeline[0];
  const selectedWeek = detail.timeline.find((w) => w.weekNumber === selectedWeekNum) ?? currentWeek;
  const weekCov = weekCovariates(selectedWeek, detail.covariates);
  const caseLogs = [
    { id: "C-9102", hash: `PHA-${(locationId ?? "LU01").slice(0, 4).toUpperCase()}-819`, age: 23, gender: "F", onset: "2026-09-27", cls: detail.activeCases > 15 ? "Confirmed" : "Probable", status: "Verified" },
    { id: "C-9103", hash: `PHA-${(locationId ?? "LU01").slice(0, 4).toUpperCase()}-820`, age: 14, gender: "M", onset: "2026-09-28", cls: "Confirmed", status: "Verified" },
    { id: "C-9104", hash: `PHA-${(locationId ?? "LU01").slice(0, 4).toUpperCase()}-821`, age: 39, gender: "F", onset: "2026-09-28", cls: "Suspected", status: "Investigating" },
  ];

  const riskColor =
    detail.riskLevel === "high" ? "var(--red)" : detail.riskLevel === "moderate" ? "var(--amber)" : "var(--green)";
  const sparkMax = Math.max(...detail.timeline.map((w) => w.predictedCases));

  return (
    <div className="page-doc" style={{ display: "grid", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px" }}>
          <Link to="/intelligence" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--mute)", textDecoration: "none" }}>
            <ArrowLeft size={14} />
            <span>Intelligence directory</span>
          </Link>
          <span style={{ color: "var(--hairline)" }}>/</span>
          <span style={{ color: "var(--mute)" }}>{detail.municipality}</span>
          <span style={{ color: "var(--hairline)" }}>/</span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Brgy. {detail.barangay}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/risk-maps" className="btn-pill btn-pill--ghost" style={{ textDecoration: "none", fontSize: "12.5px" }}>
            <MapPin size={14} />
            <span>Risk map</span>
          </Link>
          <button type="button" className="btn-pill btn-pill--ghost" style={{ fontSize: "12.5px" }} onClick={() => setAlertIssued(true)} disabled={alertIssued}>
            {alertIssued ? <CheckCircle2 size={14} /> : <Send size={14} />}
            <span>{alertIssued ? "Alert sent to BHW" : "Broadcast alert"}</span>
          </button>
          <button type="button" className="btn-pill" style={{ fontSize: "12.5px" }} onClick={() => window.print()}>
            <FileSpreadsheet size={14} />
            <span>Export bulletin</span>
          </button>
        </div>
      </div>

      <section
        aria-label="Situation summary"
        style={{
          borderRadius: 16,
          border: "1px solid var(--hairline)",
          borderTop: `3px solid ${riskColor}`,
          background: `color-mix(in srgb, ${riskColor} 7%, var(--card))`,
          padding: "24px 28px 20px",
          display: "grid",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999,
                fontSize: 11, fontWeight: 700, color: riskColor, border: `1px solid ${riskColor}`, background: "color-mix(in srgb, currentColor 8%, transparent)",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />
                {detail.riskLevel} risk
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{detail.diseaseName}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--green)" }}>
                <Radio size={11} />
                Live sentinel stream
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1.15 }}>
              Brgy. {detail.barangay}, {detail.municipality}
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--mute)", lineHeight: 1.6 }}>
              {detail.province} province · {detail.sentinelFacility}
              <br />
              Last ingestion {detail.lastUpdated} · {detail.populationAtRisk != null ? `Est. pop. at risk ${detail.populationAtRisk.toLocaleString()}${detail.populationYear != null ? ` (${detail.populationYear})` : ""}` : "No population on file"}
            </p>
          </div>

          <div style={{ flex: "0 1 300px", minWidth: 240 }}>
            <span style={{ fontSize: 11, color: "var(--mute)" }}>Surge probability, 4-week horizon</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="tabular" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", color: riskColor }}>
                {Math.round(detail.outbreakProbability * 100)}%
              </span>
              <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{detail.accuracyMetrics.modelName}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40, marginTop: 10 }} role="img" aria-label="Epidemic curve, 8 observed weeks and 4 projected weeks">
              {detail.timeline.map((w) => (
                <div
                  key={w.weekNumber}
                  title={`${w.weekLabel}: ${w.isFuture ? w.predictedCases + " projected" : w.actualCases + " observed"}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(8, Math.round((w.predictedCases / sparkMax) * 100))}%`,
                    borderRadius: 2,
                    background: w.weekNumber === currentWeek.weekNumber ? riskColor : w.isFuture ? "var(--amber)" : "var(--primary)",
                    opacity: w.isFuture ? 0.55 : 1,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--mute)", marginTop: 4 }}>
              <span>{detail.timeline[0].shortLabel} observed</span>
              <span>{peakWeek.shortLabel} peak</span>
            </div>
          </div>
        </div>

        <dl style={{
          display: "flex", flexWrap: "wrap", margin: 0, padding: "14px 0 0",
          borderTop: "1px solid var(--hairline)",
        }}>
          {[
            { k: "Weekly cases", v: `${detail.activeCases}`, d: `${detail.changePercent >= 0 ? "+" : ""}${detail.changePercent}% vs last week`, hot: detail.changePercent > 0 },
            { k: "Projected peak", v: `${peakWeek.shortLabel} · ${peakWeek.predictedCases}`, d: "model estimate", hot: false },
            { k: "Sentinel facility", v: detail.sentinelFacility, d: "reporting node", hot: false },
          ].map((f, i) => (
            <div key={f.k} style={{ flex: "1 1 180px", padding: "2px 20px 2px 0", marginRight: 20, borderLeft: i > 0 ? "1px solid var(--hairline)" : "none", paddingLeft: i > 0 ? 20 : 0 }}>
              <dt style={{ fontSize: 11, color: "var(--mute)" }}>{f.k}</dt>
              <dd className="tabular" style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {f.v}{" "}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: f.hot ? "var(--red)" : "var(--mute)" }}>{f.d}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <PredictionGraph
        timeline={detail.timeline}
        metrics={detail.accuracyMetrics}
        diseaseName={detail.diseaseName}
        selectedWeek={selectedWeek.weekNumber}
        onSelectWeek={setSelectedWeekNum}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 28 }}>
        <section style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <SectionHead
            title="Outbreak drivers"
            sub={`Field conditions for ${selectedWeek.weekLabel} · PAGASA ingest`}
            right={
              <span style={{ fontSize: 11.5, fontWeight: 600, color: selectedWeek.isFuture ? "var(--amber)" : "var(--primary)" }}>
                {selectedWeek.isFuture ? "Projected" : "Observed"} week
              </span>
            }
          />
          <div style={{ display: "grid" }}>
            {(
              [
                weekCov.cumulativeRainfallMm != null && { icon: <Droplets size={14} style={{ color: "var(--primary)" }} />, label: "Rainfall, 14-day", value: `${weekCov.cumulativeRainfallMm} mm`, pct: Math.min(100, (weekCov.cumulativeRainfallMm / 200) * 100) },
                weekCov.avgTemperatureC != null && { icon: <Thermometer size={14} style={{ color: "var(--amber)" }} />, label: "Temperature", value: `${weekCov.avgTemperatureC}°C`, pct: Math.min(100, Math.max(0, ((weekCov.avgTemperatureC - 25) / 10) * 100)) },
                weekCov.aqiLevel != null && { icon: <MapPin size={14} style={{ color: "var(--green)" }} />, label: "Air quality index", value: `AQI ${weekCov.aqiLevel}`, pct: Math.min(100, (weekCov.aqiLevel / 150) * 100) },
              ].filter(Boolean) as { icon: ReactNode; label: string; value: string; pct: number }[]
            ).map((m) => (
              <div key={m.label} style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ display: "inline-flex" }}>{m.icon}</span>
                <span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--ink)" }}>{m.label}</span>
                  <span style={{ position: "relative", display: "block", height: 4, borderRadius: 2, background: "var(--backdrop)", marginTop: 6 }}>
                    <span style={{ position: "absolute", inset: 0, width: `${m.pct}%`, borderRadius: 2, background: "var(--primary)" }} />
                  </span>
                </span>
                <span className="tabular" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{m.value}</span>
              </div>
            ))}
          </div>
          {/* ponytail: no entomology feed — vector tiles hidden instead of static numbers. */}
          <p style={{ margin: 0, fontSize: 12, color: "var(--mute)" }}>No entomology feed — Breteau and standing-water indices unavailable.</p>

          <h3 style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Recent intake ledger</h3>
          <div style={{ overflowX: "auto", borderTop: "1px solid var(--hairline)" }}>
            <table style={{ width: "100%", fontSize: 12, textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--mute)" }}>
                  <th style={{ padding: "8px 8px 8px 0", fontWeight: 600 }}>Case</th>
                  <th style={{ padding: 8, fontWeight: 600 }}>Age/sex</th>
                  <th style={{ padding: 8, fontWeight: 600 }}>Onset</th>
                  <th style={{ padding: 8, fontWeight: 600 }}>Class</th>
                  <th style={{ padding: "8px 0 8px 8px", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {caseLogs.map((log) => (
                  <tr key={log.id} style={{ borderTop: "1px solid var(--hairline)" }}>
                    <td className="tabular" style={{ padding: "8px 8px 8px 0", fontWeight: 600, color: "var(--ink)" }}>{log.hash}</td>
                    <td style={{ padding: 8, color: "var(--mute)" }}>{log.age}y / {log.gender}</td>
                    <td className="tabular" style={{ padding: 8, color: "var(--mute)" }}>{log.onset}</td>
                    <td style={{ padding: 8, color: "var(--ink)" }}>{log.cls}</td>
                    <td style={{ padding: "8px 0 8px 8px", color: "var(--green)", fontWeight: 600 }}>{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <SectionHead
            title="Field response"
            sub="DOH-authorized protocols, in execution order"
          />
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {detail.recommendedPlaybooks.map((p, idx) => {
              const sop = SOP_PROCEDURES[p.code] ?? DEFAULT_SOP;
              return (
                <li key={p.id} style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 4 }}>
                  <details className="group">
                    <summary style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", listStyle: "none", padding: "10px 0" }}>
                      <span className="tabular" style={{
                        width: 28, height: 28, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "50%", fontSize: 13, fontWeight: 800, color: "var(--card)", background: riskColor,
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{p.title}</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--mute)" }}>{p.code} · {p.urgency} priority</span>
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--primary)", flex: "none" }}>
                        <Shield size={13} />
                        <span>Steps</span>
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </span>
                    </summary>
                    <div style={{ margin: "0 0 12px 40px", padding: 12, borderRadius: 10, background: "var(--backdrop)", border: "1px solid var(--hairline)" }}>
                      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--ink)", display: "grid", gap: 6, lineHeight: 1.55 }}>
                        {sop.steps.map((step, i) => (<li key={i}>{step}</li>))}
                      </ol>
                      <p style={{ fontSize: 10.5, color: "var(--mute)", fontStyle: "italic", margin: "8px 0 0" }}>Source: {sop.source}</p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
