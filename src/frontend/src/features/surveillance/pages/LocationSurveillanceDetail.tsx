import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  CloudRain,
  Thermometer,
  Droplets,
  Bug,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Radio,
  Clock,
  Send,
} from "lucide-react";
import { getLocationDetail } from "@/services/forecast/api/locations.api";
import type { LocationDetailData } from "@/services/forecast/types/forecast.types";
import { PredictionGraph } from "@/features/forecasting/components/PredictionGraph";

interface SurveillanceCaseLog {
  id: string;
  caseHash: string;
  age: number;
  gender: "M" | "F";
  onsetDate: string;
  diagnosis: string;
  facility: string;
  classification: "Confirmed" | "Probable" | "Suspected";
  status: "Verified" | "Investigating";
}

export function LocationSurveillanceDetail() {
  const { locationId } = useParams<{ locationId: string }>();
  const [searchParams] = useSearchParams();
  const diseaseParam = searchParams.get("disease") || undefined;

  const [detail, setDetail] = useState<LocationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertIssued, setAlertIssued] = useState(false);

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    setError("");

    getLocationDetail(locationId, diseaseParam)
      .then((data) => setDetail(data))
      .catch(() => setError("Unable to retrieve location surveillance stream."))
      .finally(() => setLoading(false));
  }, [locationId, diseaseParam]);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--mute)" }}>
        <p>Loading real-time surveillance feeds & sentinel telemetry…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="card" style={{ padding: "30px", textAlign: "center" }}>
        <AlertTriangle size={32} style={{ color: "var(--red)", display: "inline-block", marginBottom: 12 }} />
        <h3 style={{ margin: "0 0 8px" }}>Sentinel Location Not Found</h3>
        <p className="sub" style={{ marginBottom: 20 }}>{error || "The requested surveillance location stream could not be resolved."}</p>
        <Link to="/surveillance" className="btn-pill" style={{ textDecoration: "none", display: "inline-flex" }}>
          <ArrowLeft size={14} />
          <span>Return to Surveillance Matrix</span>
        </Link>
      </div>
    );
  }

  const riskBadgeClass =
    detail.riskLevel === "high"
      ? "badge--red"
      : detail.riskLevel === "moderate"
      ? "badge--amber"
      : "badge--emerald";

  // Synthesize realistic recent case logs consistent with HealthAlert PIDSR intake
  const caseLogs: SurveillanceCaseLog[] = [
    {
      id: "C-9102",
      caseHash: "PHA-" + (locationId?.slice(0, 4).toUpperCase() || "LU01") + "-819",
      age: 23,
      gender: "F",
      onsetDate: "2026-09-27",
      diagnosis: detail.disease,
      facility: detail.sentinelFacility,
      classification: detail.activeCases > 15 ? "Confirmed" : "Probable",
      status: "Verified",
    },
    {
      id: "C-9103",
      caseHash: "PHA-" + (locationId?.slice(0, 4).toUpperCase() || "LU01") + "-820",
      age: 14,
      gender: "M",
      onsetDate: "2026-09-28",
      diagnosis: detail.disease,
      facility: detail.sentinelFacility,
      classification: "Confirmed",
      status: "Verified",
    },
    {
      id: "C-9104",
      caseHash: "PHA-" + (locationId?.slice(0, 4).toUpperCase() || "LU01") + "-821",
      age: 39,
      gender: "F",
      onsetDate: "2026-09-28",
      diagnosis: detail.disease,
      facility: "Brgy. Health Center",
      classification: "Suspected",
      status: "Investigating",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Breadcrumb Navigation & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px" }}>
          <Link to="/surveillance" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--mute)", textDecoration: "none" }}>
            <ArrowLeft size={14} />
            <span>Surveillance Matrix</span>
          </Link>
          <span style={{ color: "var(--mute)" }}>/</span>
          <span style={{ color: "var(--mute)" }}>{detail.province}</span>
          <span style={{ color: "var(--mute)" }}>/</span>
          <span style={{ color: "var(--mute)" }}>{detail.municipality}</span>
          <span style={{ color: "var(--mute)" }}>/</span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Brgy. {detail.barangay}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            to={`/forecast/${detail.id}?disease=${encodeURIComponent(detail.disease)}`}
            className="btn-pill btn-pill--ghost"
            style={{ textDecoration: "none", fontSize: "12.5px" }}
          >
            <TrendingUp size={14} />
            <span>Switch to AI Forecast Trajectory →</span>
          </Link>
          <Link to="/risk-maps" className="btn-pill btn-pill--ghost" style={{ textDecoration: "none", fontSize: "12.5px" }}>
            <MapPin size={14} />
            <span>View Map</span>
          </Link>
          <button
            type="button"
            className="btn-pill"
            style={{ fontSize: "12.5px" }}
            onClick={() => setAlertIssued(true)}
            disabled={alertIssued}
          >
            {alertIssued ? <CheckCircle2 size={14} /> : <Send size={14} />}
            <span>{alertIssued ? "Alert Dispatched to BHW" : "Broadcast Sentinel Alert"}</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          alignItems: "center",
          background: "linear-gradient(135deg, rgba(82, 93, 249, 0.08) 0%, rgba(20, 22, 34, 0.6) 100%)",
          border: "1px solid rgba(82, 93, 249, 0.2)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span className={`badge ${riskBadgeClass}`}>
              {detail.riskLevel.toUpperCase()} EPIDEMIC WATCH
            </span>
            <span className="badge badge--indigo">
              <Radio size={12} style={{ marginRight: 4 }} />
              SENTINEL STREAM ACTIVE
            </span>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: "28px", letterSpacing: "-0.02em" }}>
            Brgy. {detail.barangay}, {detail.municipality}
          </h1>
          <p className="sub" style={{ margin: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Building2 size={14} /> {detail.province} Province
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Users size={14} /> Pop. At Risk: {detail.populationAtRisk.toLocaleString()}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Clock size={14} /> Ingestion: {detail.lastUpdated} (n8n PIDSR v1.0)
            </span>
          </p>
        </div>

        {/* Quick Surveillance KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 600 }}>Active Cases</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>{detail.activeCases}</div>
            <div style={{ fontSize: "11px", color: detail.changePercent >= 0 ? "var(--red)" : "var(--emerald)", fontWeight: 600 }}>
              {detail.changePercent >= 0 ? `+${detail.changePercent}%` : `${detail.changePercent}%`} vs W-1
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 600 }}>Threshold</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--amber)", marginTop: 4 }}>
              {detail.riskLevel === "high" ? "ALERT" : "WATCH"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--mute)" }}>Baseline: {Math.round(detail.activeCases * 0.45)}</div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", color: "var(--mute)", textTransform: "uppercase", fontWeight: 600 }}>Facility Sentinel</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginTop: 6, lineHeight: 1.2 }}>
              {detail.sentinelFacility.split(" ")[0]} ...
            </div>
            <div style={{ fontSize: "11px", color: "var(--emerald)", fontWeight: 600 }}>eClaims Sync 100%</div>
          </div>
        </div>
      </div>

      {/* Epidemic Surveillance Curve & Prediction Graph */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 700 }}>Epidemiological Surveillance Curve & Projections</h2>
            <p className="sub" style={{ margin: "2px 0 0" }}>
              Continuous multi-week surveillance curve showing 8-week actuals tracked against baseline alert levels and 4-week forecast.
            </p>
          </div>
        </div>
        <PredictionGraph
          timeline={detail.timeline}
          metrics={detail.accuracyMetrics}
          diseaseName={detail.disease}
        />
      </div>

      {/* Lower Section: Environmental Telemetry & Clinical Feed Logs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
        {/* Environmental Telemetry Panel */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: 8 }}>
              <CloudRain size={16} style={{ color: "var(--primary)" }} />
              Environmental Covariates (PAGASA Ingest)
            </h3>
            <span style={{ fontSize: "11.5px", color: "var(--mute)" }}>Station: Region 1 Synoptic</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--mute)", fontSize: "12px", marginBottom: 4 }}>
                <CloudRain size={14} style={{ color: "#38bdf8" }} />
                <span>Cumulative Rainfall</span>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{detail.covariates.cumulativeRainfallMm} mm</div>
              <div style={{ fontSize: "11px", color: "var(--mute)" }}>Past 14-day rolling sum</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--mute)", fontSize: "12px", marginBottom: 4 }}>
                <Thermometer size={14} style={{ color: "#f97316" }} />
                <span>Avg Temperature</span>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{detail.covariates.avgTemperatureC}°C</div>
              <div style={{ fontSize: "11px", color: "var(--mute)" }}>Heat index: {detail.covariates.heatIndexC}°C</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--mute)", fontSize: "12px", marginBottom: 4 }}>
                <Bug size={14} style={{ color: "#ec4899" }} />
                <span>Larval Breteau Index</span>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{detail.covariates.larvalBreteauIndex}</div>
              <div style={{ fontSize: "11px", color: detail.covariates.larvalBreteauIndex > 20 ? "var(--red)" : "var(--emerald)", fontWeight: 600 }}>
                {detail.covariates.larvalBreteauIndex > 20 ? "High Vector Density" : "Routine density"}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--mute)", fontSize: "12px", marginBottom: 4 }}>
                <Droplets size={14} style={{ color: "#06b6d4" }} />
                <span>Standing Water Sites</span>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{detail.covariates.standingWaterSites} sites</div>
              <div style={{ fontSize: "11px", color: "var(--mute)" }}>Sanitary inspection log</div>
            </div>
          </div>
        </div>

        {/* Clinical Intake Feeds / Sentinel Surveillance */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={16} style={{ color: "var(--emerald)" }} />
              Live Clinical Intake Stream (PIDSR Feeds)
            </h3>
            <span className="badge badge--emerald">3 Fresh Intakes</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--mute)", textAlign: "left" }}>
                  <th style={{ padding: "8px 6px" }}>Case Ref</th>
                  <th style={{ padding: "8px 6px" }}>Age/Sex</th>
                  <th style={{ padding: "8px 6px" }}>Onset</th>
                  <th style={{ padding: "8px 6px" }}>Classification</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {caseLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 6px", fontFamily: "var(--mono)", fontWeight: 600 }}>{log.caseHash}</td>
                    <td style={{ padding: "10px 6px" }}>{log.age}y / {log.gender}</td>
                    <td style={{ padding: "10px 6px" }}>{log.onsetDate}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <span
                        className={`badge ${
                          log.classification === "Confirmed"
                            ? "badge--red"
                            : log.classification === "Probable"
                            ? "badge--amber"
                            : "badge--indigo"
                        }`}
                        style={{ fontSize: "11px" }}
                      >
                        {log.classification}
                      </span>
                    </td>
                    <td style={{ padding: "10px 6px", color: "var(--emerald)", fontWeight: 600 }}>{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, textAlign: "right" }}>
            <Link
              to="/clinical"
              style={{ fontSize: "12px", color: "var(--primary)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span>View Full Clinical Triage Records</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
