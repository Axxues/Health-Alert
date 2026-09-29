import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  MapPin,
  Layers,
  X,
  Compass,
  ArrowRight,
  TrendingUp,
  Workflow,
  AlertCircle,
} from "lucide-react";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { PHMap } from "../components/PHMap";

const DISEASE_FILTERS = ["all", "dengue", "leptospirosis", "ili", "asthma"] as const;

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

      {/* Disease Layer Filter Toolbar */}
      <div className="section-card p-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2 shrink-0">
          Disease Layer:
        </span>
        <div className="flex gap-1.5 items-center">
          {DISEASE_FILTERS.map((d) => (
            <button
              key={d}
              className={`btn-pill text-xs px-3 py-1 capitalize ${filter === d ? "" : "btn-pill--ghost"}`}
              onClick={() => {
                setFilter(d);
                setSelected(null);
              }}
              type="button"
            >
              {d === "all" ? "All Diseases (Full Overlay)" : d}
            </button>
          ))}
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
        <div className="section-card overflow-hidden" style={{ minHeight: 480 }}>
          {filteredSpots.length === 0 && !error ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No active hotspots found for the selected disease filter.
            </div>
          ) : (
            <PHMap spots={filteredSpots} selected={selected} onSelect={setSelected} />
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
                  Selected Hotspot
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
                  Target Syndrome
                </span>
                <span className="font-semibold text-foreground capitalize">{selected.disease}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Compass size={14} />
                  Centroid
                </span>
                <span className="font-mono text-foreground">{selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  Surveillance
                </span>
                <span className="text-emerald-500 font-semibold">Active transmission</span>
              </div>
            </div>

            <div className="grid gap-2 pt-2 border-t border-border">
              <Link
                className="btn-pill text-xs justify-center py-2 no-underline"
                to="/forecast"
              >
                <span>Run Forecast for {selected.muni}</span>
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
              <Link
                className="btn-pill btn-pill--ghost text-xs justify-center py-2 no-underline"
                to="/playbooks"
              >
                <Workflow size={14} strokeWidth={2.2} />
                <span>Trigger Outbreak Playbook</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
