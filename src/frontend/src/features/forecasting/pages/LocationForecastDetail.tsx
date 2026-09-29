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

      {/* Location Overview Header - Cellwego section-card */}
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
                {detail.riskLevel === "high" && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />}
                {detail.riskLevel} Risk Zone
              </span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[11px] font-semibold capitalize">
                {detail.diseaseName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground m-0 mb-1">
              Brgy. {detail.barangay}, {detail.municipality}
            </h1>
            <p className="text-xs text-muted-foreground m-0">
              Province of {detail.province}, Region 1 (Ilocos Region) · Sentinel Node Telemetry
            </p>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Surge Probability</span>
            <div className={`font-mono text-3xl font-extrabold leading-tight ${detail.riskLevel === "high" ? "text-destructive" : "text-amber-500"}`}>
              {Math.round(detail.outbreakProbability * 100)}%
            </div>
            <small className="text-[11px] text-muted-foreground block mt-0.5">
              Bi-LSTM Early Warning Confidence: High
            </small>
          </div>
        </div>

        {/* 4 Metric Telemetry Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Activity size={18} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">Weekly Cases</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold text-foreground">{detail.activeCases}</span>
                <span className={`text-xs font-bold ${detail.changePercent > 0 ? "text-destructive" : "text-emerald-500"}`}>
                  {detail.changePercent > 0 ? `+${detail.changePercent}%` : `${detail.changePercent}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Calendar size={18} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">Projected Peak</span>
              <span className="font-mono text-sm font-bold text-foreground block">
                {peakWeek.weekLabel.split(" ")[0]} ({peakWeek.predictedCases} cases)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Users size={18} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">Population at Risk</span>
              <span className="font-mono text-sm font-bold text-foreground block">
                {detail.populationAtRisk.toLocaleString()} residents
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Building2 size={18} strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">Sentinel Facility</span>
              <span className="text-xs font-semibold text-foreground block truncate max-w-[180px]">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental & Clinical Covariates */}
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <CloudRain size={16} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-foreground m-0">Environmental & Clinical Covariates</h3>
          </div>

          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-4">
              Real-time multi-source inputs driving Bi-LSTM & ARGO predictive weighting.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-card border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Droplets size={13} className="text-cyan-500" />
                  <span>14-Day Rain</span>
                </span>
                <div className="font-mono text-xl font-bold text-foreground mt-1">
                  {detail.covariates.cumulativeRainfallMm} mm
                </div>
                <small className="text-[11px] text-muted-foreground">PAGASA radar ingest</small>
              </div>

              <div className="p-3.5 rounded-lg bg-card border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Thermometer size={13} className="text-amber-500" />
                  <span>Avg Temperature</span>
                </span>
                <div className="font-mono text-xl font-bold text-foreground mt-1">
                  {detail.covariates.avgTemperatureC}°C
                </div>
                <small className="text-[11px] text-muted-foreground">Accelerates breeding</small>
              </div>

              <div className="p-3.5 rounded-lg bg-card border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Bug size={13} className="text-destructive" />
                  <span>Breteau Larval Index</span>
                </span>
                <div className={`font-mono text-xl font-bold mt-1 ${detail.covariates.larvalBreteauIndex >= 20 ? "text-destructive" : "text-foreground"}`}>
                  {detail.covariates.larvalBreteauIndex}
                </div>
                <small className={`text-[11px] ${detail.covariates.larvalBreteauIndex >= 20 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {detail.covariates.larvalBreteauIndex >= 20 ? "Exceeds threshold (≥20)" : "Routine surveillance"}
                </small>
              </div>

              <div className="p-3.5 rounded-lg bg-card border border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sun size={13} className="text-amber-500" />
                  <span>Heat Index / AQI</span>
                </span>
                <div className="font-mono text-xl font-bold text-foreground mt-1">
                  {detail.covariates.heatIndexC}°C / AQI {detail.covariates.aqiLevel}
                </div>
                <small className="text-[11px] text-muted-foreground">Rothfusz formula</small>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended SOP Response Playbooks */}
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Workflow size={16} strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-foreground m-0">Recommended Field SOP Playbooks</h3>
            </div>
            <Link to="/playbooks" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>All SOPs</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-4">
              DOH-authorized response protocols triggered based on predicted case velocity.
            </p>

            <div className="divide-y divide-border">
              {detail.recommendedPlaybooks.map((p) => {
                const isDispatched = deployed.has(p.id);
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Shield size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground m-0">{p.title}</p>
                        <span className="text-[11px] font-mono text-muted-foreground uppercase">{p.code} · {p.urgency} priority</span>
                      </div>
                    </div>
                    <div>
                      {isDispatched ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>Dispatched</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-pill text-xs px-3 py-1 gap-1.5"
                          onClick={() => handleDeploy(p.id)}
                        >
                          <Play size={11} strokeWidth={2.5} />
                          <span>Deploy SOP</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
