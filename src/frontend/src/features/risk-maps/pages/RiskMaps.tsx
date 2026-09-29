import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  MapPin,
  Layers,
  X,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Activity,
} from "lucide-react";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { PHMap } from "../components/PHMap";

const DISEASE_FILTERS = [
  { id: "all", label: "All Diseases", full: "All Diseases (Full Overlay)" },
  { id: "dengue", label: "Dengue", full: "Dengue Fever" },
  { id: "leptospirosis", label: "Leptospirosis", full: "Leptospirosis" },
  { id: "ili", label: "Influenza-like (ILI)", full: "Flu-like Illness (ILI)" },
  { id: "asthma", label: "Bronchial Asthma", full: "Bronchial Asthma" },
] as const;

function levelPill(level: string) {
  if (/high/i.test(level)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
        High Outbreak Risk
      </span>
    );
  }
  if (/med|moderate/i.test(level)) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
        Elevated Watch
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
      Routine Surveillance
    </span>
  );
}

export function RiskMaps() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [showDensity, setShowDensity] = useState<boolean>(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots()
      .then(setSpots)
      .catch(() => setError("Unable to load geospatial hotspot telemetry. Please retry."));
  }, []);

  const filteredSpots = filter === "all" ? spots : spots.filter((s) => s.disease.toLowerCase() === filter);

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="dash-head m-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5">
              <Layers size={13} strokeWidth={2.2} />
              Geospatial Outbreak Matrix
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight m-0">Geographic Disease Risk & Hotspots</h1>
          <p className="text-xs text-muted-foreground m-0 mt-0.5">
            Spatial epidemiology overlay mapping high-transmission clusters and environmental hazard zones across LGUs.
          </p>
        </div>
      </div>

      {/* Disease Layer Filter & Overlay Toolbar */}
      <div className="section-card p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
            Disease Layer:
          </span>
          <div className="flex gap-1.5 items-center flex-wrap">
            {DISEASE_FILTERS.map((d) => {
              const count =
                d.id === "all"
                  ? spots.length
                  : spots.filter((s) => s.disease.toLowerCase() === d.id).length;
              const isActive = filter === d.id;

              return (
                <button
                  key={d.id}
                  className={`btn-pill text-xs px-3 py-1 flex items-center gap-1.5 ${isActive ? "" : "btn-pill--ghost"}`}
                  onClick={() => {
                    setFilter(d.id);
                    setSelected(null);
                  }}
                  type="button"
                >
                  <span>{d.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className={`btn-pill text-xs px-3 py-1 gap-1.5 ${showDensity ? "" : "btn-pill--ghost"}`}
            onClick={() => setShowDensity(!showDensity)}
            title="Toggle outbreak transmission density zone buffers"
          >
            <span>Transmission Zones</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${showDensity ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {showDensity ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-semibold">
          <AlertCircle size={16} strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      {/* Map + Hotspot Details Drawer */}
      <div className={`maplayout${selected ? " maplayout--open" : ""}`}>
        <div className="section-card overflow-hidden" style={{ minHeight: 520 }}>
          {filteredSpots.length === 0 && !error ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No active hotspots found for the selected disease filter.
            </div>
          ) : (
            <PHMap
              spots={filteredSpots}
              selected={selected}
              onSelect={setSelected}
              showDensity={showDensity}
            />
          )}
        </div>

        {selected && (
          <div
            className="section-card border-l-4 border-l-primary p-5 sticky top-20 shadow-lg space-y-4"
            key={`${selected.muni}-${selected.disease}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {selected.province || "Region 1 Surveillance"}
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5 mb-0">{selected.muni}</h3>
              </div>
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setSelected(null)}
                aria-label="Close hotspot panel"
                title="Close hotspot panel"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div>
              {levelPill(selected.level)}
            </div>

            <div className="divide-y divide-border text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin size={14} />
                  Target Disease
                </span>
                <span className="font-semibold text-foreground">
                  {selected.diseaseName || selected.disease}
                </span>
              </div>
              {selected.sentinelFacility && (
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={14} />
                    Sentinel Facility
                  </span>
                  <span className="font-medium text-foreground text-right max-w-[190px] truncate" title={selected.sentinelFacility}>
                    {selected.sentinelFacility}
                  </span>
                </div>
              )}
              {selected.cases !== undefined && (
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Activity size={14} />
                    Active Cases
                  </span>
                  <span className="font-bold text-foreground tabular-nums">
                    {selected.cases} cases
                  </span>
                </div>
              )}
              {selected.probability !== undefined && (
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    Surge Probability
                  </span>
                  <span className="font-bold text-destructive tabular-nums">
                    {Math.round(selected.probability * 100)}%
                  </span>
                </div>
              )}
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Compass size={14} />
                  Centroid
                </span>
                <span className="text-foreground font-medium tabular-nums">{selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E</span>
              </div>
            </div>

            <div className="grid gap-2 pt-2 border-t border-border">
              <Link
                className="btn-pill text-xs justify-center py-2 no-underline"
                to={selected.id ? `/intelligence/${selected.id}?disease=${encodeURIComponent(selected.disease)}` : `/intelligence`}
              >
                <span>View Disease Intelligence Details</span>
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
