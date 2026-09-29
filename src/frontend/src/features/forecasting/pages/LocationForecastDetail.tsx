import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  Activity,
  Calendar,
  CloudRain,
  Thermometer,
  Droplets,
  Bug,
  Sun,
  Workflow,
  Play,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { getLocationDetail } from "@/services/forecast/api/locations.api";
import type { LocationDetailData } from "@/services/forecast/types/forecast.types";
import { PredictionGraph } from "../components/PredictionGraph";

export function LocationForecastDetail() {
  const { locationId } = useParams<{ locationId: string }>();
  const [searchParams] = useSearchParams();
  const diseaseParam = searchParams.get("disease") || undefined;

  const [detail, setDetail] = useState<LocationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deployed, setDeployed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    setError("");

    getLocationDetail(locationId, diseaseParam)
      .then((data) => setDetail(data))
      .catch(() => setError("Unable to retrieve location epidemiological telemetry."))
      .finally(() => setLoading(false));
  }, [locationId, diseaseParam]);

  function handleDeploy(id: number) {
    setDeployed((prev) => new Set(prev).add(id));
  }

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
        <p className="sub" style={{ marginBottom: 20 }}>{error || "The requested surveillance sentinel area could not be resolved."}</p>
        <Link to="/forecast" className="btn-pill" style={{ textDecoration: "none", display: "inline-flex" }}>
          <ArrowLeft size={14} />
          <span>Return to Forecast Directory</span>
        </Link>
      </div>
    );
  }

  const peakWeek = detail.timeline.reduce((max, w) => (w.predictedCases > max.predictedCases ? w : max), detail.timeline[0]);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px" }}>
          <Link to="/forecast" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--mute)", textDecoration: "none" }}>
            <ArrowLeft size={14} />
            <span>Forecasting Directory</span>
          </Link>
          <span style={{ color: "var(--mute)" }}>/</span>
          <span style={{ color: "var(--mute)" }}>{detail.province}</span>
          <span style={{ color: "var(--mute)" }}>/</span>
          <span style={{ color: "var(--mute)" }}>{detail.municipality}</span>
          <span style={{ color: "var(--mute)" }}>/</span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Brgy. {detail.barangay}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/risk-maps" className="btn-pill btn-pill--ghost" style={{ textDecoration: "none", fontSize: "12.5px" }}>
            <MapPin size={14} />
            <span>View on Risk Map</span>
          </Link>
          <button
            type="button"
            className="btn-pill"
            style={{ fontSize: "12.5px" }}
            onClick={() => window.print()}
          >
            <FileSpreadsheet size={14} />
            <span>Export Intelligence Bulletin</span>
          </button>
        </div>
      </div>

      {/* Location Overview Header */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className={`pill ${detail.riskLevel === "high" ? "pill--bad" : detail.riskLevel === "moderate" ? "pill--warn" : "pill--ok"}`}>
                {detail.riskLevel === "high" && <span className="dot dot--pulse" />}
                <span style={{ textTransform: "uppercase" }}>{detail.riskLevel} Risk Zone</span>
              </span>
              <span className="pill pill--primary" style={{ fontSize: "11px" }}>
                {detail.diseaseName}
              </span>
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: "28px" }}>
              {detail.barangay}, {detail.municipality}
            </h1>
            <p className="sub" style={{ fontSize: "14px" }}>
              Province of {detail.province}, Region 1 (Ilocos Region) · Sentinel Node Telemetry
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Outbreak Surge Probability</span>
            <span className="tabular" style={{ fontSize: "36px", fontWeight: 800, color: detail.riskLevel === "high" ? "var(--red)" : "var(--amber)", lineHeight: 1.1 }}>
              {Math.round(detail.outbreakProbability * 100)}%
            </span>
            <small style={{ fontSize: "11px", color: "var(--mute)", display: "block", marginTop: 2 }}>
              Bi-LSTM Early Warning Confidence: High
            </small>
          </div>
        </div>

        {/* 4 Metric Telemetry Tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "block" }}>Current Weekly Cases</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)" }}>{detail.activeCases}</span>
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: detail.changePercent > 0 ? "var(--red)" : "var(--green)" }}>
                  {detail.changePercent > 0 ? `+${detail.changePercent}%` : `${detail.changePercent}%`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--amber-bg)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "block" }}>Projected Outbreak Peak</span>
              <span className="tabular" style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>
                {peakWeek.weekLabel.split(" ")[0]} ({peakWeek.predictedCases} cases)
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--backdrop)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "block" }}>Population at Risk</span>
              <span className="tabular" style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>
                {detail.populationAtRisk.toLocaleString()} residents
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--backdrop)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "block" }}>Primary Sentinel Facility</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", display: "block", lineHeight: 1.2 }}>
                {detail.sentinelFacility}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Graph (Past 8 Weeks vs Future 4 Weeks with Accuracy Scorecard) */}
      <PredictionGraph
        timeline={detail.timeline}
        metrics={detail.accuracyMetrics}
        diseaseName={detail.diseaseName}
      />

      {/* Environmental Covariates & SOP Playbook Recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Environmental & Clinical Covariates */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <CloudRain size={18} strokeWidth={2.2} style={{ color: "var(--cyan)" }} />
            <h3 style={{ margin: 0, fontSize: "16px" }}>Environmental & Clinical Covariates</h3>
          </div>
          <p className="sub" style={{ fontSize: "13px", marginBottom: 18 }}>
            Real-time multi-source inputs driving Bi-LSTM & ARGO predictive weighting.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--card-subtle)", border: "1px solid var(--hairline)" }}>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 5 }}>
                <Droplets size={13} style={{ color: "var(--cyan)" }} />
                <span>14-Day Cumulative Rain</span>
              </span>
              <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                {detail.covariates.cumulativeRainfallMm} mm
              </div>
              <small style={{ fontSize: "11px", color: "var(--mute)" }}>PAGASA radar ingest</small>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--card-subtle)", border: "1px solid var(--hairline)" }}>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 5 }}>
                <Thermometer size={13} style={{ color: "var(--amber)" }} />
                <span>Average Temperature</span>
              </span>
              <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                {detail.covariates.avgTemperatureC}°C
              </div>
              <small style={{ fontSize: "11px", color: "var(--mute)" }}>Accelerates vector breeding</small>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--card-subtle)", border: "1px solid var(--hairline)" }}>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 5 }}>
                <Bug size={13} style={{ color: "var(--red)" }} />
                <span>Breteau Larval Index</span>
              </span>
              <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: detail.covariates.larvalBreteauIndex >= 20 ? "var(--red)" : "var(--ink)", marginTop: 4 }}>
                {detail.covariates.larvalBreteauIndex}
              </div>
              <small style={{ fontSize: "11px", color: detail.covariates.larvalBreteauIndex >= 20 ? "var(--red)" : "var(--mute)" }}>
                {detail.covariates.larvalBreteauIndex >= 20 ? "Exceeds alert threshold (≥20)" : "Routine surveillance"}
              </small>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--card-subtle)", border: "1px solid var(--hairline)" }}>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 5 }}>
                <Sun size={13} style={{ color: "var(--amber)" }} />
                <span>Heat Index / AQI</span>
              </span>
              <div className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                {detail.covariates.heatIndexC}°C / AQI {detail.covariates.aqiLevel}
              </div>
              <small style={{ fontSize: "11px", color: "var(--mute)" }}>Rothfusz formula</small>
            </div>
          </div>
        </div>

        {/* Recommended SOP Response Playbooks */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Workflow size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "16px" }}>Recommended Field SOP Playbooks</h3>
            </div>
            <Link to="/playbooks" style={{ fontSize: "12.5px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span>All SOPs</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <p className="sub" style={{ fontSize: "13px", marginBottom: 18 }}>
            DOH-authorized response protocols triggered based on predicted case velocity.
          </p>

          <ul className="rows">
            {detail.recommendedPlaybooks.map((p) => {
              const isDispatched = deployed.has(p.id);
              return (
                <li key={p.id} style={{ padding: "10px 0" }}>
                  <div className="glyph" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    <Shield size={16} strokeWidth={2.2} />
                  </div>
                  <div className="meta">
                    <p style={{ fontWeight: 600 }}>{p.title}</p>
                    <small className="tabular">{p.code} · {p.urgency.toUpperCase()} PRIORITY</small>
                  </div>
                  <span className="tail">
                    {isDispatched ? (
                      <span className="pill pill--ok" style={{ fontSize: "11px", gap: 4 }}>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        <span>Dispatched</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-pill"
                        onClick={() => handleDeploy(p.id)}
                        style={{ minHeight: 30, padding: "3px 12px", fontSize: "12px", gap: 5 }}
                      >
                        <Play size={11} strokeWidth={2.5} />
                        <span>Deploy SOP</span>
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
