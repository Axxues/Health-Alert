import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Layers,
  X,
  Compass,
  ArrowRight,
  AlertCircle,
  Radio,
} from "lucide-react";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { PHMap } from "../components/PHMap";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  PageHeader,
  Skeleton,
} from "@/components/ui";

const DISEASE_FILTERS = [
  { id: "all", label: "All Diseases", full: "All Diseases (Full Overlay)" },
  { id: "dengue", label: "Dengue", full: "Dengue Fever" },
  { id: "leptospirosis", label: "Leptospirosis", full: "Leptospirosis" },
  { id: "ili", label: "Influenza-like (ILI)", full: "Flu-like Illness (ILI)" },
  { id: "asthma", label: "Bronchial Asthma", full: "Bronchial Asthma" },
] as const;

function levelBadge(level: string) {
  if (/high/i.test(level)) {
    return (
      <Badge variant="danger" pulse>
        High Outbreak Risk
      </Badge>
    );
  }
  if (/med|moderate/i.test(level)) {
    return <Badge variant="warning">Elevated Watch</Badge>;
  }
  return <Badge variant="success">Routine Surveillance</Badge>;
}

export function RiskMaps() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [showDensity, setShowDensity] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    listHotspots()
      .then(setSpots)
      .catch((e) =>
        setError(e instanceof Error && e.message ? e.message : "Unable to load geospatial hotspot telemetry.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredSpots = filter === "all" ? spots : spots.filter((s) => s.disease.toLowerCase() === filter);

  // ponytail: one node = one barangay; the panel lists every disease sharing it
  const selectedGroup = selected
    ? filteredSpots.filter(
        (s) => s.muni === selected.muni && (s.barangay || "") === (selected.barangay || "")
      )
    : [];
  const worstLevel = selectedGroup.some((s) => /high/i.test(s.level))
    ? "high"
    : selectedGroup.some((s) => /med|moderate/i.test(s.level))
    ? "medium"
    : "low";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Geographic Disease Risk & Hotspots"
        description="Spatial epidemiology overlay mapping high-transmission clusters, sentinel facility buffers, and environmental hazard zones across LGUs."
        badge={
          <Badge variant="primary">
            <Layers size={12} className="mr-1" />
            Geospatial Outbreak Matrix
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showDensity ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowDensity(!showDensity)}
            >
              <span>Transmission Buffers: {showDensity ? "ON" : "OFF"}</span>
            </Button>
          </div>
        }
      />

      {/* Disease Layer Filter Toolbar */}
      <Card className="p-3.5 flex items-center justify-between gap-3 flex-wrap bg-card shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
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
                  type="button"
                  onClick={() => {
                    setFilter(d.id);
                    setSelected(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{d.label}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
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

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio size={13} className="text-emerald-500 animate-pulse" />
          <span>Active Leaflet Geospatial Engine</span>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {/* Geospatial Map + Hotspot Inspector Split Canvas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Map Container */}
        <div className={`${selected ? "lg:col-span-8" : "lg:col-span-12"} transition-all duration-200`}>
          <Card className="overflow-hidden p-0 relative shadow-sm border border-border">
            {loading ? (
              <Skeleton className="h-[560px] w-full" />
            ) : filteredSpots.length === 0 && !error ? (
              <div className="py-24 text-center text-xs text-muted-foreground">
                No active hotspots found for the selected disease filter.
              </div>
            ) : (
              <div className="h-[560px] w-full">
                <PHMap
                  spots={filteredSpots}
                  selected={selected}
                  onSelect={setSelected}
                  showDensity={showDensity}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Hotspot Inspector Side Drawer */}
        {selected && (
          <div className="lg:col-span-4 space-y-4 animate-in fade-in-0 duration-150">
            <Card className="border-l-4 border-l-primary p-5 shadow-md">
              <CardHeader className="p-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      {selected.province || "Philippine National Surveillance"}
                    </span>
                    <CardTitle className="text-xl mt-0.5">
                      {selected.barangay ? `Brgy. ${selected.barangay}` : selected.muni}
                    </CardTitle>
                    {selected.barangay && (
                      <span className="text-xs text-muted-foreground">{selected.muni}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Close hotspot panel"
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </CardHeader>

              <div className="space-y-4">
                <div>{levelBadge(worstLevel)}</div>

                <div className="divide-y divide-border/60 text-xs">
                  {selectedGroup.map((s) => (
                    <div key={s.id ?? s.disease} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-foreground block">
                          {s.diseaseName || s.disease}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {s.cases ?? 0} cases · {Math.round((s.probability ?? 0) * 100)}% surge
                        </span>
                      </div>
                      <Link
                        to={
                          s.id
                            ? `/intelligence/${s.id}?disease=${encodeURIComponent(s.disease)}`
                            : `/intelligence`
                        }
                      >
                        <Button variant="outline" size="sm">
                          <span>Deep-Dive</span>
                          <ArrowRight size={14} />
                        </Button>
                      </Link>
                    </div>
                  ))}

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Compass size={14} />
                      Coordinates
                    </span>
                    <span className="text-foreground font-mono text-[11px] tabular-nums">
                      {selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
