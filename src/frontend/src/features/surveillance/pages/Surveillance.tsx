import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Radio,
  Database,
  Zap,
  AlertCircle,
  Search,
  MapPin,
  Building2,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Filter,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { listFeeds } from "@/services/surveillance/api";
import type { SurveillanceFeed } from "@/services/surveillance/types";
import { listLocations } from "@/services/forecast/api/locations.api";
import type { LocationDiseaseEntry, LocationFilter } from "@/services/forecast/types/forecast.types";
import { FeedTable } from "../components/FeedTable";

const PROVINCES = ["All Provinces", "La Union", "Pangasinan", "Ilocos Sur", "Ilocos Norte"];

const MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  "La Union": ["All Municipalities", "San Fernando City", "Agoo", "Bauang", "Bacnotan", "San Juan"],
  "Pangasinan": ["All Municipalities", "Dagupan City", "San Carlos City", "Urdaneta City", "Lingayen", "Calasiao"],
  "Ilocos Sur": ["All Municipalities", "Vigan City", "Candon City", "Narvacan", "Tagudin"],
  "Ilocos Norte": ["All Municipalities", "Laoag City", "Batac City", "San Nicolas", "Dingras"],
};

const DISEASES = [
  { id: "all", label: "All Diseases" },
  { id: "dengue", label: "Dengue" },
  { id: "leptospirosis", label: "Leptospirosis" },
  { id: "ili", label: "Influenza-Like (ILI)" },
  { id: "asthma", label: "Asthma" },
];

export function Surveillance() {
  const [feeds, setFeeds] = useState<SurveillanceFeed[]>([]);
  const [locations, setLocations] = useState<LocationDiseaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"locations" | "pipelines">("locations");

  // Filter state for sentinel locations
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [selectedMunicipality, setSelectedMunicipality] = useState("All Municipalities");
  const [selectedDisease, setSelectedDisease] = useState("all");

  useEffect(() => {
    listFeeds()
      .then(setFeeds)
      .catch(() => setError("Could not load surveillance feeds. Try again."));
  }, []);

  const loadLocations = () => {
    setLoading(true);
    const filter: LocationFilter = {
      search: searchQuery || undefined,
      province: selectedProvince !== "All Provinces" ? selectedProvince : undefined,
      municipality: selectedMunicipality !== "All Municipalities" ? selectedMunicipality : undefined,
      disease: selectedDisease !== "all" ? selectedDisease : undefined,
    };

    listLocations(filter)
      .then((data) => setLocations(data))
      .catch(() => setError("Failed to retrieve monitored sentinel locations."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedProvince, selectedMunicipality, selectedDisease]);

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedMunicipality("All Municipalities");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProvince("All Provinces");
    setSelectedMunicipality("All Municipalities");
    setSelectedDisease("all");
  };

  const isFiltered =
    Boolean(searchQuery) ||
    selectedProvince !== "All Provinces" ||
    selectedMunicipality !== "All Municipalities" ||
    selectedDisease !== "all";

  const availableMunicipalities = useMemo(() => {
    if (selectedProvince === "All Provinces") {
      const allMunis = Object.values(MUNICIPALITIES_BY_PROVINCE).flatMap((list) =>
        list.filter((m) => m !== "All Municipalities")
      );
      return ["All Municipalities", ...Array.from(new Set(allMunis))];
    }
    return MUNICIPALITIES_BY_PROVINCE[selectedProvince] || ["All Municipalities"];
  }, [selectedProvince]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Automated Data Pipeline Active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              DOH PIDSR & PAGASA Ingestion
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Multi-Syndromic Surveillance & Monitored Sentinels
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time disease surveillance streams, clinical reporting health centers, and automated pipeline telemetry across Region 1.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/forecast"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <TrendingUp size={15} strokeWidth={2.2} />
            <span>AI Forecast Models</span>
            <ArrowRight size={13} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Surveillance Feed Telemetry Metrics - Cellwego border-l-4 style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">24h Ingested Records</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">14,820</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">EDCS-IS, PAGASA, & Clinics</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Database size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-indigo-500 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Monitored Sentinels</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">{locations.length}</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Active clinical intake</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <MapPin size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-amber-500 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Pipeline Latency</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">380ms</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Sub-second streaming</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Zap size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-emerald-500 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Active Pipelines</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">{feeds.length || 10}</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">100% Ingestion Uptime</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Radio size={20} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Sentinels Matrix vs. Ingestion Pipelines */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("locations")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "locations"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MapPin size={14} />
          <span>Monitored Sentinel Locations ({locations.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pipelines")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "pipelines"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Radio size={14} />
          <span>Ingestion Pipelines ({feeds.length || 10})</span>
        </button>
      </div>

      {activeTab === "locations" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Filter sentinels by barangay, municipality, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-background border border-input rounded-md text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Geographic Dropdowns */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 shadow-xs">
                  <Building2 size={14} className="text-muted-foreground shrink-0" />
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="bg-transparent border-none text-xs text-foreground focus:outline-none cursor-pointer pr-1"
                  >
                    {PROVINCES.map((prov) => (
                      <option key={prov} value={prov} className="bg-card text-foreground">
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 shadow-xs">
                  <MapPin size={14} className="text-muted-foreground shrink-0" />
                  <select
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    className="bg-transparent border-none text-xs text-foreground focus:outline-none cursor-pointer pr-1"
                  >
                    {availableMunicipalities.map((muni) => (
                      <option key={muni} value={muni} className="bg-card text-foreground">
                        {muni}
                      </option>
                    ))}
                  </select>
                </div>

                {isFiltered && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleClearFilters}
                  >
                    <RefreshCw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Disease Filter Pills */}
            <div className="pt-3.5 border-t border-border flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase tracking-wider text-[10px]">
                Tracked Disease:
              </span>
              {DISEASES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDisease(d.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedDisease === d.id
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Sentinel Directory Grid */}
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--mute)" }}>
              <p>Scanning active sentinel data feeds…</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <Filter size={32} style={{ color: "var(--mute)", display: "inline-block", marginBottom: 12 }} />
              <h3 style={{ margin: "0 0 6px" }}>No Monitored Sentinel Locations Found</h3>
              <p className="sub" style={{ marginBottom: 16 }}>Try resetting search filters or changing province selection.</p>
              <button type="button" className="btn-pill" onClick={handleClearFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc) => {
                const borderAccent =
                  loc.riskLevel === "high"
                    ? "border-l-destructive"
                    : loc.riskLevel === "moderate"
                    ? "border-l-amber-500"
                    : "border-l-emerald-500";

                const riskBadge =
                  loc.riskLevel === "high"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : loc.riskLevel === "moderate"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                return (
                  <div
                    key={loc.id}
                    className={`bg-card border border-border border-l-4 ${borderAccent} rounded-lg p-5 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${riskBadge}`}>
                            {loc.riskLevel} Watch
                          </span>
                          <h3 className="text-base font-bold text-foreground mt-2 mb-0.5">
                            Brgy. {loc.barangay}
                          </h3>
                          <p className="text-xs text-muted-foreground m-0">
                            {loc.municipality}, {loc.province}
                          </p>
                        </div>

                        <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[11px] font-semibold capitalize">
                          {loc.diseaseName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-md border border-border mt-3">
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Active Cases</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="font-mono text-lg font-bold text-foreground">
                              {loc.activeCases}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${loc.changePercent > 0 ? "text-destructive" : "text-emerald-500"}`}
                            >
                              {loc.changePercent > 0 ? `+${loc.changePercent}%` : `${loc.changePercent}%`}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Sentinel Node</span>
                          <div className="text-xs font-semibold text-foreground mt-1 truncate">
                            {loc.sentinelFacility}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate">PIDSR Stream Live · Synced {loc.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3">
                      <Link
                        to={`/surveillance/${loc.id}?disease=${encodeURIComponent(loc.disease)}`}
                        className="btn-pill w-full justify-center text-xs py-2 gap-1.5 no-underline"
                      >
                        <span>View Surveillance Stream</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Main Ingestion Feed Card - Cellwego section-card */
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground m-0">Configured Ingest Pipelines</h3>
              <p className="text-xs text-muted-foreground m-0">Synchronized with DOH RA 11332 mandatory reporting standards.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              {feeds.length || 10} Verified Sources
            </span>
          </div>

          <div className="p-6">
            {error ? (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-semibold">
                <AlertCircle size={16} strokeWidth={2} />
                <span>{error}</span>
              </div>
            ) : (
              <FeedTable feeds={feeds} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
