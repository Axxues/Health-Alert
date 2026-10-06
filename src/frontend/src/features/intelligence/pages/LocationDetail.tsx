import { useEffect, useState } from "react";
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
  Compass,
} from "lucide-react";
import { getLocationDetail } from "@/services/forecast/api/locations.api";
import type { LocationDetailData, TimelineWeek } from "@/services/forecast/types/forecast.types";
import { PredictionGraph } from "@/features/forecasting/components/PredictionGraph";
import {
  Button,
  Card,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  PageHeader,
  Skeleton,
} from "@/components/ui";

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
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
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
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle size={36} className="text-destructive mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Sentinel Station Not Found</h2>
          <p className="text-xs text-muted-foreground">{error || "The requested sentinel area could not be resolved."}</p>
        </div>
        <Link to="/intelligence">
          <Button variant="outline" size="md" icon={<ArrowLeft size={14} />}>
            Return to Intelligence Matrix
          </Button>
        </Link>
      </Card>
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

  const sparkMax = Math.max(...detail.timeline.map((w) => w.predictedCases));
  const probPercent = Math.round(detail.outbreakProbability * 100);
  const isHighRisk = detail.riskLevel === "high";

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setBroadcastOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Brgy. ${detail.barangay}, ${detail.municipality}`}
        description={`${detail.province} Province · ${detail.sentinelFacility} · Last telemetry sync ${detail.lastUpdated}`}
        breadcrumbs={[
          { label: "Intelligence", path: "/intelligence" },
          { label: detail.municipality },
          { label: `Brgy. ${detail.barangay}` },
        ]}
        badge={
          <Badge variant={isHighRisk ? "danger" : detail.riskLevel === "moderate" ? "warning" : "success"} pulse={isHighRisk}>
            {detail.riskLevel === "high" ? "High Outbreak Risk" : detail.riskLevel === "moderate" ? "Elevated Watch" : "Routine Baseline"}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/risk-maps">
              <Button variant="outline" size="sm" icon={<Compass size={14} />}>
                Risk Map
              </Button>
            </Link>
            <Button
              variant={broadcastSent ? "secondary" : "destructive"}
              size="sm"
              icon={broadcastSent ? <CheckCircle2 size={14} /> : <Send size={14} />}
              onClick={() => setBroadcastOpen(true)}
              disabled={broadcastSent}
            >
              {broadcastSent ? "Alert Broadcasted" : "Broadcast Field Alert"}
            </Button>
            <Button variant="outline" size="sm" icon={<FileSpreadsheet size={14} />} onClick={() => window.print()}>
              Print Bulletin
            </Button>
          </div>
        }
      />

      {/* Hero Telemetry Card */}
      <Card className={`overflow-hidden ${isHighRisk ? "border-l-4 border-l-destructive bg-gradient-to-r from-card via-card to-destructive/5" : ""}`}>
        <div className="p-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Col 1: Overview */}
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary">{detail.diseaseName}</Badge>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Radio size={12} className="animate-pulse" />
                Live Sentinel Stream
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {detail.municipality} Epidemiological Profile
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Monitoring sentinel surveillance node serving {detail.populationAtRisk != null ? `est. ${detail.populationAtRisk.toLocaleString()} population at risk` : "the local catchment area"}. Transmission vectors analyzed through bi-LSTM recursive regression and regional climatic sensor feeds.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/60">
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Weekly Cases</span>
                <span className="text-xl font-extrabold font-mono tabular-nums text-foreground">{detail.activeCases}</span>
                <span className={`text-[10px] font-semibold block ${detail.changePercent >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {detail.changePercent >= 0 ? `+${detail.changePercent}%` : `${detail.changePercent}%`} vs prev week
                </span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Projected Peak</span>
                <span className="text-xl font-extrabold font-mono tabular-nums text-foreground">{peakWeek.predictedCases}</span>
                <span className="text-[10px] text-muted-foreground block">{peakWeek.shortLabel} model peak</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Sentinel Facility</span>
                <span className="text-xs font-bold text-foreground truncate block mt-1">{detail.sentinelFacility}</span>
                <span className="text-[10px] text-muted-foreground block">Primary Reporting Node</span>
              </div>
            </div>
          </div>

          {/* Col 2: Probability & Sparkline */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                4-Week Surge Probability
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-extrabold font-mono tabular-nums ${isHighRisk ? "text-destructive" : "text-foreground"}`}>
                  {probPercent}%
                </span>
                <span className="text-xs text-muted-foreground">({detail.accuracyMetrics.modelName})</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="pt-4">
              <div className="flex items-end gap-1.5 h-16 w-full pb-1">
                {detail.timeline.map((w) => {
                  const isCurrent = w.weekNumber === currentWeek.weekNumber;
                  const hPct = Math.max(12, Math.round((w.predictedCases / sparkMax) * 100));
                  return (
                    <div
                      key={w.weekNumber}
                      title={`${w.weekLabel}: ${w.isFuture ? w.predictedCases + " projected" : w.actualCases + " observed"}`}
                      className={`flex-1 rounded-xs transition-all ${
                        isCurrent
                          ? "bg-destructive"
                          : w.isFuture
                          ? "bg-amber-500/70"
                          : "bg-primary"
                      }`}
                      style={{ height: `${hPct}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/60">
                <span>{detail.timeline[0].shortLabel} observed</span>
                <span>{peakWeek.shortLabel} peak</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Bi-LSTM Forecast Chart */}
      <Card className="p-5">
        <PredictionGraph
          timeline={detail.timeline}
          metrics={detail.accuracyMetrics}
          diseaseName={detail.diseaseName}
          selectedWeek={selectedWeek.weekNumber}
          onSelectWeek={setSelectedWeekNum}
        />
      </Card>

      {/* Outbreak Drivers & Clinical Response Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Environmental Sensor Covariates & Intake Ledger */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
              <div>
                <CardTitle>Environmental Outbreak Drivers</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Field telemetry for {selectedWeek.weekLabel} · Sensor ingestion
                </p>
              </div>
              <span className={`text-xs font-semibold ${selectedWeek.isFuture ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}>
                {selectedWeek.isFuture ? "Projected Week" : "Observed Week"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {weekCov.cumulativeRainfallMm != null && (
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Droplets size={14} className="text-primary" />
                    <span>Rainfall (14d)</span>
                  </div>
                  <span className="text-lg font-extrabold font-mono tabular-nums text-foreground block">
                    {weekCov.cumulativeRainfallMm} mm
                  </span>
                </div>
              )}

              {weekCov.avgTemperatureC != null && (
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Thermometer size={14} className="text-amber-500" />
                    <span>Mean Temp</span>
                  </div>
                  <span className="text-lg font-extrabold font-mono tabular-nums text-foreground block">
                    {weekCov.avgTemperatureC}°C
                  </span>
                </div>
              )}

              {weekCov.aqiLevel != null && (
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={14} className="text-emerald-500" />
                    <span>Air Quality</span>
                  </div>
                  <span className="text-lg font-extrabold font-mono tabular-nums text-foreground block">
                    AQI {weekCov.aqiLevel}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Intake Ledger */}
          <Card className="p-5 space-y-3">
            <CardTitle>Recent Sentinel Intake Ledger</CardTitle>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Code</TableHead>
                  <TableHead>Demographics</TableHead>
                  <TableHead>Onset Date</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caseLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono font-bold">{log.hash}</TableCell>
                    <TableCell className="text-muted-foreground">{log.age}y / {log.gender}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{log.onset}</TableCell>
                    <TableCell className="font-medium text-foreground">{log.cls}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success">{log.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Right: DOH Clinical Response SOP Playbooks */}
        <Card className="p-5 space-y-4">
          <div className="border-b border-border/60 pb-3">
            <CardTitle>DOH Clinical & Field Response Playbooks</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorized standard operating procedures in execution priority
            </p>
          </div>

          <div className="space-y-3">
            {detail.recommendedPlaybooks.map((p, idx) => {
              const sop = SOP_PROCEDURES[p.code] ?? DEFAULT_SOP;
              return (
                <details
                  key={p.id}
                  className="group rounded-xl border border-border/80 bg-muted/20 p-4 transition-all open:bg-card open:shadow-xs"
                >
                  <summary className="flex items-center justify-between gap-3 cursor-pointer select-none">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-foreground block">{p.title}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {p.code} · {p.urgency} Priority
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <Shield size={13} />
                      <span>Protocol</span>
                      <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-150" />
                    </div>
                  </summary>

                  <div className="mt-3.5 pt-3 border-t border-border/60 space-y-2.5 text-xs pl-9">
                    <ol className="list-decimal list-inside space-y-1.5 text-foreground leading-relaxed">
                      {sop.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border/40">
                      Source: {sop.source}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Broadcast Alert Modal Dialog */}
      <Dialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title={`Broadcast Emergency Alert — ${detail.municipality}`}
        description="Trigger real-time SMS and webhook notification to Barangay Health Workers and RHU Officers."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSendBroadcast}>
              Confirm & Dispatch Alert
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
            This will trigger a high-priority dispatch to all registered sentinel units in {detail.municipality}.
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Field Message / Clinical Directives
            </label>
            <textarea
              rows={3}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="e.g. Surge detected in Brgy. San Fernando. Initiate 4-o'clock cleanup habit and fever lane triage immediately."
              className="w-full rounded-lg border border-input bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
