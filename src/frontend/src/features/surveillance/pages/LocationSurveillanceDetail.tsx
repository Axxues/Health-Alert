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

      {/* Header Banner - Cellwego section-card */}
      <div className={`section-card border-l-4 ${detail.riskLevel === "high" ? "border-l-destructive" : detail.riskLevel === "moderate" ? "border-l-amber-500" : "border-l-emerald-500"} p-6`}>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                detail.riskLevel === "high"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : detail.riskLevel === "moderate"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              }`}>
                {detail.riskLevel} Epidemic Watch
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                <Radio size={11} className="mr-0.5" />
                Sentinel Stream Active
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground m-0 mb-1">
              Brgy. {detail.barangay}, {detail.municipality}
            </h1>
            <p className="text-xs text-muted-foreground m-0 flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={13} /> {detail.province} Province
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={13} /> Pop. At Risk: {detail.populationAtRisk.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} /> Ingestion: {detail.lastUpdated} (n8n PIDSR v1.0)
              </span>
            </p>
          </div>

          {/* Quick Surveillance KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Active Cases</div>
              <div className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{detail.activeCases}</div>
              <div className={`text-[11px] font-semibold ${detail.changePercent >= 0 ? "text-destructive" : "text-emerald-500"}`}>
                {detail.changePercent >= 0 ? `+${detail.changePercent}%` : `${detail.changePercent}%`} vs W-1
              </div>
            </div>

            <div className="bg-muted/40 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Threshold</div>
              <div className="text-lg font-bold text-amber-500 mt-1">
                {detail.riskLevel === "high" ? "ALERT" : "WATCH"}
              </div>
              <div className="text-[11px] text-muted-foreground">Baseline: {Math.round(detail.activeCases * 0.45)}</div>
            </div>

            <div className="bg-muted/40 p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Sentinel Facility</div>
              <div className="text-xs font-bold text-foreground mt-1 truncate max-w-[110px]">
                {detail.sentinelFacility.split(" ")[0]}
              </div>
              <div className="text-[11px] text-emerald-500 font-semibold">eClaims 100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Epidemic Surveillance Curve & Prediction Graph */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-bold text-foreground m-0">Epidemiological Surveillance Curve & Projections</h2>
          <p className="text-xs text-muted-foreground m-0 mt-0.5">
            Continuous multi-week surveillance curve showing 8-week actuals tracked against baseline alert levels and 4-week forecast.
          </p>
        </div>
        <PredictionGraph
          timeline={detail.timeline}
          metrics={detail.accuracyMetrics}
          diseaseName={detail.disease}
        />
      </div>

      {/* Lower Section: Environmental Telemetry & Clinical Feed Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental Telemetry Panel */}
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-2">
              <CloudRain size={16} className="text-primary" />
              <span>Environmental Covariates (PAGASA Ingest)</span>
            </h3>
            <span className="text-xs text-muted-foreground">Region 1 Synoptic</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-3 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <CloudRain size={14} className="text-sky-400" />
                  <span>Cumulative Rainfall</span>
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums">{detail.covariates.cumulativeRainfallMm} mm</div>
                <div className="text-[11px] text-muted-foreground">Past 14-day rolling sum</div>
              </div>

              <div className="bg-card p-3 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Thermometer size={14} className="text-amber-500" />
                  <span>Avg Temperature</span>
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums">{detail.covariates.avgTemperatureC}°C</div>
                <div className="text-[11px] text-muted-foreground">Heat index: {detail.covariates.heatIndexC}°C</div>
              </div>

              <div className="bg-card p-3 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Bug size={14} className="text-rose-500" />
                  <span>Larval Breteau Index</span>
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums">{detail.covariates.larvalBreteauIndex}</div>
                <div className={`text-[11px] font-semibold ${detail.covariates.larvalBreteauIndex > 20 ? "text-destructive" : "text-emerald-500"}`}>
                  {detail.covariates.larvalBreteauIndex > 20 ? "High Vector Density" : "Routine density"}
                </div>
              </div>

              <div className="bg-card p-3 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Droplets size={14} className="text-cyan-500" />
                  <span>Standing Water Sites</span>
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums">{detail.covariates.standingWaterSites} sites</div>
                <div className="text-[11px] text-muted-foreground">Sanitary inspection log</div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Intake Feeds / Sentinel Surveillance */}
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-2">
              <Radio size={16} className="text-emerald-500" />
              <span>Live Clinical Intake Stream (PIDSR Feeds)</span>
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
              3 Fresh Intakes
            </span>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Case Ref</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Age/Sex</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Onset</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Classification</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {caseLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-semibold text-foreground">{log.caseHash}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{log.age}y / {log.gender}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{log.onsetDate}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            log.classification === "Confirmed"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : log.classification === "Probable"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {log.classification}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-emerald-500 font-semibold">{log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3.5 text-right">
              <Link
                to="/clinical"
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View Full Clinical Triage Records</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
