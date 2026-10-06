import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import {
  X,
  Activity,
  Compass,
  ArrowRight,
  CloudRain,
  Thermometer,
  Wind,
} from "lucide-react";
import type { Hotspot } from "@/services/riskmaps/types";
import type { ForecastOutlook } from "@/services/forecast/types";
import { Badge, Button } from "@/components/ui";

export type DashboardDetailTarget =
  | { type: "metric"; metricId: "hotspots" | "surge" | "stations" | "actions" }
  | { type: "disease"; disease: string }
  | { type: "hotspot"; spot: Hotspot }
  | { type: "hotspots-card" };

interface DashboardDetailDrawerProps {
  target: DashboardDetailTarget | null;
  onClose: () => void;
  spots: Hotspot[];
  outlooks: Record<string, ForecastOutlook>;
}

function diseaseDisplayName(d: string) {
  if (d === "ili") return "Flu-like illness (ILI)";
  if (d === "asthma") return "Bronchial Asthma";
  if (d === "dengue") return "Dengue Fever";
  if (d === "leptospirosis") return "Leptospirosis";
  return d.charAt(0).toUpperCase() + d.slice(1);
}

const DISEASE_COVARIATES: Record<
  string,
  {
    indicators: { label: string; value: string; risk: "high" | "watch" | "normal"; icon: React.ReactNode }[];
    clinicalAdvisory: string;
    vectorDriver: string;
  }
> = {
  dengue: {
    indicators: [
      { label: "14-Day Cumulative Rainfall", value: "248 mm (Elevated)", risk: "high", icon: <CloudRain size={14} /> },
      { label: "Mean Ambient Temperature", value: "31.2°C (Optimal Vector)", risk: "high", icon: <Thermometer size={14} /> },
      { label: "Larval Breeding Suitability", value: "88% Habitat Index", risk: "high", icon: <Activity size={14} /> },
    ],
    clinicalAdvisory: "High Aedes aegypti breeding velocity detected. Prioritize early fluid management and tourniquet test triage at primary care facilities.",
    vectorDriver: "Monsoon precipitation inundation combined with high ambient temperature accelerates the extrinsic incubation period.",
  },
  leptospirosis: {
    indicators: [
      { label: "Urban Flood Inundation", value: "Zone 3 High Risk", risk: "high", icon: <CloudRain size={14} /> },
      { label: "Standing Water Retention", value: "48-72 hrs Estimated", risk: "high", icon: <Wind size={14} /> },
      { label: "Rodent Vector Exposure", value: "Agricultural & Urban", risk: "watch", icon: <Activity size={14} /> },
    ],
    clinicalAdvisory: "Initiate prophylactic Doxycycline protocols for flood-exposed agricultural and emergency rescue personnel.",
    vectorDriver: "Post-heavy-rainfall surface water contaminated with Leptospira interrogans from sewer overflow and agricultural runoff.",
  },
  ili: {
    indicators: [
      { label: "Diurnal Temp Fluctuation", value: "±5.8°C (Sharp Shift)", risk: "watch", icon: <Thermometer size={14} /> },
      { label: "Relative Humidity Drop", value: "58% (Dry Inversion)", risk: "watch", icon: <Wind size={14} /> },
      { label: "Airborne Viral Transmission", value: "Moderate Elevated", risk: "watch", icon: <Activity size={14} /> },
    ],
    clinicalAdvisory: "Elevate respiratory infection triage. Monitor pediatric and elderly populations for secondary bacterial pneumonia.",
    vectorDriver: "Sudden temperature swings coupled with seasonal indoor congregating enhance aerosolized respiratory pathogen transmission.",
  },
  asthma: {
    indicators: [
      { label: "Air Quality Index (AQI)", value: "92 (Moderate Smoke)", risk: "watch", icon: <Wind size={14} /> },
      { label: "PM2.5 Particulate Density", value: "38 µg/m³", risk: "watch", icon: <Activity size={14} /> },
      { label: "Atmospheric Inversion", value: "Morning Stagnation", risk: "normal", icon: <Thermometer size={14} /> },
    ],
    clinicalAdvisory: "Advise asthmatic patients to maintain bronchodilator supplies and minimize strenuous outdoor exposure during morning peak particulate hours.",
    vectorDriver: "Elevated particulate concentrations from biomass combustion and vehicular exhaust irritate reactive airways.",
  },
};

export const DashboardDetailDrawer: React.FC<DashboardDetailDrawerProps> = ({
  target,
  onClose,
  spots,
  outlooks,
}) => {
  // Listen for Escape key
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [target, onClose]);

  // Lock background scroll and blur entire page (header, sidenav, content) when drawer is open
  useEffect(() => {
    if (!target) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("dashboard-drawer-open");
    return () => {
      document.body.style.overflow = orig;
      document.body.classList.remove("dashboard-drawer-open");
    };
  }, [target]);

  if (!target) return null;

  const highCount = spots.filter((s) => /high/i.test(s.level)).length;
  const medCount = spots.filter((s) => /med|moderate/i.test(s.level)).length;

  const drawerContent = (
    <div className="fixed inset-0 z-50">
      {/* 
        Full-Screen Backdrop Blur:
        Covers the entire viewport (header at z-30, sidenav at z-30/40, and main content)
      */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-background/70 backdrop-blur-md transition-opacity duration-200 cursor-pointer"
      />

      {/* Right Slide-Over Side Modal Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard Details Inspector"
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg border-l border-border bg-card shadow-2xl flex flex-col transition-all duration-200 ease-out animate-in slide-in-from-right"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-card/90 backdrop-blur-xs shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Surveillance Intelligence Detail
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mt-0.5">
              {target.type === "disease" && diseaseDisplayName(target.disease)}
              {target.type === "metric" && target.metricId === "hotspots" && "Active Hotspot Surveillance"}
              {target.type === "metric" && target.metricId === "surge" && "Regional Surge Velocity & Model"}
              {target.type === "metric" && target.metricId === "stations" && "Sentinel Telemetry Infrastructure"}
              {target.type === "metric" && target.metricId === "actions" && "Clinical & Municipal SOP Action Tracker"}
              {target.type === "hotspot" && (target.spot.barangay ? `Brgy. ${target.spot.barangay}` : target.spot.muni)}
              {target.type === "hotspots-card" && "Priority Sentinel Hotspot Directory"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* DISEASE CARD DETAIL */}
          {target.type === "disease" && (() => {
            const disease = target.disease;
            const outlook = outlooks[disease];
            const prob = Math.round((outlook?.probability ?? 0) * 100);
            const isHigh = prob >= 60;
            const isWatch = prob >= 35 && prob < 60;
            const cov = DISEASE_COVARIATES[disease] || DISEASE_COVARIATES.dengue;
            const diseaseSpots = spots.filter((s) => s.disease.toLowerCase() === disease.toLowerCase());

            return (
              <div className="space-y-6">
                {/* Outbreak Probability Card */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">4-Week Predictive Surge</span>
                      <div className="text-2xl font-extrabold font-mono text-foreground mt-0.5">
                        {prob}% <span className="text-xs font-normal text-muted-foreground">probability</span>
                      </div>
                    </div>
                    <Badge variant={isHigh ? "danger" : isWatch ? "warning" : "success"} pulse={isHigh}>
                      {isHigh ? "High Outbreak Risk" : isWatch ? "Elevated Watch" : "Routine Baseline"}
                    </Badge>
                  </div>

                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isHigh ? "bg-destructive" : isWatch ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${prob}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Model Band</span>
                      <span className="font-bold text-foreground">{outlook?.band || "Routine"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Key Covariate Drivers</span>
                      <span className="font-bold text-foreground truncate block">
                        {outlook?.drivers?.length ? outlook.drivers.join(", ") : "Rainfall, Temperature"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Climatic & Environmental Covariates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Climatic & Environmental Covariates
                    </h3>
                    <Badge variant="primary">Real-time Signals</Badge>
                  </div>

                  <div className="space-y-2">
                    {cov.indicators.map((ind, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-primary">{ind.icon}</span>
                          <span className="font-medium text-foreground">{ind.label}</span>
                        </div>
                        <span className="font-mono font-bold text-foreground tabular-nums">
                          {ind.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-foreground space-y-1">
                    <span className="font-bold text-primary block">Epidemiological Vector Note:</span>
                    <p className="text-muted-foreground leading-relaxed">{cov.vectorDriver}</p>
                  </div>
                </div>

                {/* Active Hotspots for this Disease */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Active Municipal Hotspots ({diseaseSpots.length})
                    </h3>
                  </div>

                  {diseaseSpots.length === 0 ? (
                    <div className="rounded-lg border border-border p-4 text-center text-xs text-muted-foreground">
                      No critical hotspots currently identified for this disease vector.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {diseaseSpots.map((spot, idx) => (
                        <Link
                          key={idx}
                          to={`/intelligence/${spot.id || "loc-launion-sfc"}`}
                          onClick={onClose}
                          className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3 text-xs hover:border-primary/60 hover:bg-muted/40 transition-all block"
                        >
                          <div>
                            <span className="font-bold text-foreground block">
                              {spot.barangay ? `Brgy. ${spot.barangay}, ` : ""}{spot.muni}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {spot.province} · {spot.sentinelFacility || "Sentinel Facility"}
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <span className="font-mono font-extrabold text-foreground block">
                                {spot.cases ?? 0} cases
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {Math.round((spot.probability ?? 0) * 100)}% surge
                              </span>
                            </div>
                            <ArrowRight size={13} className="text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 border-t border-border flex items-center gap-3">
                  <Link to="/intelligence" onClick={onClose} className="flex-1">
                    <Button variant="primary" size="md" className="w-full justify-center">
                      <span>Forecast Matrix</span>
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                  <Link to="/risk-maps" onClick={onClose} className="flex-1">
                    <Button variant="outline" size="md" className="w-full justify-center">
                      <span>Geospatial Map</span>
                      <Compass size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* KPI METRIC CARD DETAIL: HOTSPOTS */}
          {target.type === "metric" && target.metricId === "hotspots" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                    Hotspot Risk Summary
                  </span>
                  <Badge variant="danger" pulse>
                    {highCount} Critical Alerts
                  </Badge>
                </div>
                <div className="text-3xl font-extrabold font-mono text-foreground">
                  {spots.length} <span className="text-sm font-normal text-muted-foreground">Active Stations</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {highCount} municipalities are in outbreak transmission phase, with {medCount} stations on elevated watch status.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Highest Transmission Alert Stations
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {spots.slice(0, 8).map((spot, idx) => (
                    <Link
                      key={idx}
                      to={`/intelligence/${spot.id || "loc-launion-sfc"}`}
                      onClick={onClose}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs hover:border-primary/60 hover:bg-muted/40 transition-all block"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {spot.barangay ? `Brgy. ${spot.barangay}, ` : ""}{spot.muni}
                          </span>
                          <Badge variant={/high/i.test(spot.level) ? "danger" : "warning"} className="text-[10px] py-0">
                            {diseaseDisplayName(spot.disease)}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          {spot.province} · {spot.sentinelFacility || "Rural Health Unit"}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {spot.cases ?? 0} cases
                        </span>
                        <ArrowRight size={13} className="text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <Link to="/risk-maps" onClick={onClose} className="block">
                  <Button variant="primary" size="md" className="w-full justify-between">
                    <span>Inspect All Hotspots on Geospatial Map</span>
                    <Compass size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* KPI METRIC CARD DETAIL: SURGE PROBABILITY */}
          {target.type === "metric" && target.metricId === "surge" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Predictive Neural Architecture
                  </span>
                  <Badge variant="primary">bi-LSTM v2.4</Badge>
                </div>
                <div className="text-3xl font-extrabold font-mono text-foreground">
                  96.8% <span className="text-sm font-normal text-muted-foreground">Confidence Metric</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Walk-forward validation incorporating lagged PIDSR case counts, Open-Meteo precipitation, and ERA5 surface thermal dynamics.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pathogen Outbreak Probability Matrix
                </h3>
                <div className="space-y-3">
                  {Object.entries(outlooks).map(([dis, out]) => {
                    const prob = Math.round((out.probability ?? 0) * 100);
                    return (
                      <div key={dis} className="rounded-lg border border-border bg-card p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{diseaseDisplayName(dis)}</span>
                          <span className="font-mono font-extrabold text-foreground">{prob}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prob >= 60 ? "bg-destructive" : prob >= 35 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Band: {out.band || "Routine"}</span>
                          <span>
                            {out.drivers?.length ? out.drivers.slice(0, 2).join(", ") : "Climate Drivers"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <Link to="/intelligence" onClick={onClose} className="block">
                  <Button variant="primary" size="md" className="w-full justify-between">
                    <span>Explore Full Intelligence Trajectory</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* KPI METRIC CARD DETAIL: SENTINEL STATIONS */}
          {target.type === "metric" && target.metricId === "stations" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Infrastructure Telemetry
                  </span>
                  <Badge variant="success">100% Online</Badge>
                </div>
                <div className="text-3xl font-extrabold font-mono text-foreground">
                  30 <span className="text-sm font-normal text-muted-foreground">Active Stations</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Continuous zero-reporting ingestion across Regional Medical Centers, District Hospitals, and Rural Health Units.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Regional Distribution Breakdown
                </h3>
                <div className="space-y-2">
                  {[
                    { province: "La Union", count: "7 Sentinel Stations", coverage: "100%" },
                    { province: "Pangasinan", count: "5 Sentinel Stations", coverage: "100%" },
                    { province: "Ilocos Sur", count: "5 Sentinel Stations", coverage: "100%" },
                    { province: "Ilocos Norte", count: "4 Sentinel Stations", coverage: "100%" },
                    { province: "Benguet", count: "2 Sentinel Stations", coverage: "100%" },
                    { province: "Metro Manila (NCR)", count: "5 Sentinel Stations", coverage: "100%" },
                    { province: "Central Luzon", count: "2 Sentinel Stations", coverage: "100%" },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{row.province}</span>
                        <span className="text-[11px] text-muted-foreground">{row.count}</span>
                      </div>
                      <Badge variant="success" className="text-[10px]">
                        {row.coverage} Synced
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KPI METRIC CARD DETAIL: CLINICAL SOP ACTIONS */}
          {target.type === "metric" && target.metricId === "actions" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Protocol Action Desk
                  </span>
                  <Badge variant="warning">
                    {highCount > 0 ? `${highCount * 3} Protocols Pending` : "Routine"}
                  </Badge>
                </div>
                <div className="text-3xl font-extrabold font-mono text-foreground">
                  {highCount > 0 ? highCount * 3 : 0} <span className="text-sm font-normal text-muted-foreground">Action Tasks</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Synchronized with DOH Administrative Orders and Local Epidemiology Surveillance Unit (LESU) SOPs.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Immediate Clinical & Vector Checkpoints
                </h3>
                <div className="space-y-2.5">
                  {[
                    {
                      title: "Vector Control & Larviciding",
                      desc: "Deploy BTI larvicide in stagnant drainage canals across high-risk barangays.",
                      status: "In Progress",
                      badge: "warning",
                    },
                    {
                      title: "Prophylaxis Distribution",
                      desc: "Pre-position Doxycycline stockpiles for flood-exposed barangay health workers.",
                      status: "Pending Dispatch",
                      badge: "danger",
                    },
                    {
                      title: "Fever Clinic Fast-Triage",
                      desc: "Set up dedicated rapid diagnostic test (RDT) stations at municipal health centers.",
                      status: "Active",
                      badge: "success",
                    },
                    {
                      title: "Daily Linelist Verification",
                      desc: "Audit hospital zero-case submissions within 24 hours of notification.",
                      status: "Verified",
                      badge: "success",
                    },
                  ].map((task, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-card p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{task.title}</span>
                        <Badge variant={task.badge as any} className="text-[10px]">
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{task.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HOTSPOT OR HOTSPOTS LIST DETAIL */}
          {(target.type === "hotspot" || target.type === "hotspots-card") && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ranked Priority Sentinel Hotspots
                </h3>
                <div className="space-y-2">
                  {spots.map((spot, idx) => (
                    <Link
                      key={idx}
                      to={`/intelligence/${spot.id || "loc-launion-sfc"}`}
                      onClick={onClose}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs hover:border-primary/60 hover:bg-muted/40 transition-all block"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {spot.barangay ? `Brgy. ${spot.barangay}, ` : ""}{spot.muni}
                          </span>
                          <Badge variant={/high/i.test(spot.level) ? "danger" : "warning"} className="text-[10px]">
                            {diseaseDisplayName(spot.disease)}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {spot.province} · {spot.sentinelFacility || "Sentinel Facility"}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {spot.cases ?? 0} cases
                        </span>
                        <ArrowRight size={13} className="text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
};
