import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  TrendingUp,
  Search,
  MapPin,
  Building2,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Activity,
  ChevronRight,
  X,
} from "lucide-react";
import { listLocations } from "@/services/forecast/api/locations.api";
import type { LocationDiseaseEntry, LocationFilter } from "@/services/forecast/types/forecast.types";

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
  { id: "asthma", label: "Bronchial Asthma" },
];

const RISK_LEVELS = [
  { id: "all", label: "All Risk Bands" },
  { id: "high", label: "High Risk", color: "var(--red)" },
  { id: "moderate", label: "Moderate Watch", color: "var(--amber)" },
  { id: "low", label: "Routine Baseline", color: "var(--green)" },
];

export function Forecast() {
  const [locations, setLocations] = useState<LocationDiseaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [selectedMunicipality, setSelectedMunicipality] = useState("All Municipalities");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");

  const loadData = () => {
    setLoading(true);
    setError("");
    const filter: LocationFilter = {
      search: searchQuery || undefined,
      province: selectedProvince !== "All Provinces" ? selectedProvince : undefined,
      municipality: selectedMunicipality !== "All Municipalities" ? selectedMunicipality : undefined,
      disease: selectedDisease !== "all" ? selectedDisease : undefined,
      riskLevel: selectedRisk !== "all" ? selectedRisk : undefined,
    };

    listLocations(filter)
      .then((data) => setLocations(data))
      .catch(() => setError("Failed to retrieve location forecast directory."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedProvince, selectedMunicipality, selectedDisease, selectedRisk]);

  // Reset municipality when province changes
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedMunicipality("All Municipalities");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProvince("All Provinces");
    setSelectedMunicipality("All Municipalities");
    setSelectedDisease("all");
    setSelectedRisk("all");
  };

  const isFiltered =
    Boolean(searchQuery) ||
    selectedProvince !== "All Provinces" ||
    selectedMunicipality !== "All Municipalities" ||
    selectedDisease !== "all" ||
    selectedRisk !== "all";

  // Municipalities for the current province
  const availableMunicipalities = useMemo(() => {
    if (selectedProvince === "All Provinces") {
      const allMunis = Object.values(MUNICIPALITIES_BY_PROVINCE).flatMap((list) =>
        list.filter((m) => m !== "All Municipalities")
      );
      return ["All Municipalities", ...Array.from(new Set(allMunis))];
    }
    return MUNICIPALITIES_BY_PROVINCE[selectedProvince] || ["All Municipalities"];
  }, [selectedProvince]);

  // Summary counts
  const highRiskCount = locations.filter((l) => l.riskLevel === "high").length;
  const totalCases = locations.reduce((sum, l) => sum + l.activeCases, 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <TrendingUp size={13} strokeWidth={2.2} />
              AI Predictive Outbreak Intelligence
            </span>
            <span className="live-badge">
              <span className="dot dot--pulse" />
              Continuous Sentinel Tracking
            </span>
          </div>
          <h1>Location Disease Forecast & Early Warning</h1>
          <p className="sub">
            Filter and examine monitored barangays across Region 1 to evaluate disease outbreak probabilities, multi-week predictive curves, and targeted intervention playbooks.
          </p>
        </div>

        <div className="dash-actions">
          <Link
            className="btn-pill btn-pill--ghost"
            to="/surveillance"
            style={{ textDecoration: "none" }}
          >
            <Activity size={16} strokeWidth={2.2} />
            <span>Live Surveillance Feeds</span>
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Directory Quick Telemetry Banner - Cellwego border-l-4 style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Monitored Sentinels</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">{locations.length} Locations</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Active surveillance coverage</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MapPin size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-destructive rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Surge Alert Zones</span>
            <div className="text-2xl font-bold tracking-tight text-destructive mt-1 font-mono">{highRiskCount} High Risk</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Exceeds alert threshold</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-amber-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Active Monitored Cases</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">{totalCases} Cases</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Current PIDSR reporting week</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Activity size={20} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div className="section-card p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="flex-1 min-w-[260px] relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search barangay, municipality, province, or disease..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-background border border-input rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Geographic Selects */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-muted-foreground" />
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-muted-foreground" />
              <select
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {availableMunicipalities.map((muni) => (
                  <option key={muni} value={muni}>
                    {muni}
                  </option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <button
                type="button"
                className="btn-pill btn-pill--ghost text-xs px-2.5 py-1.5 gap-1"
                onClick={handleClearFilters}
              >
                <RefreshCw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Disease & Risk Band Pills */}
        <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap gap-4 items-center justify-between">
          {/* Disease Filter Pills */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-medium text-muted-foreground mr-1">Disease:</span>
            {DISEASES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDisease(d.id)}
                className={`btn-pill text-xs px-2.5 py-1 ${selectedDisease === d.id ? "" : "btn-pill--ghost"}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Risk Band Pills */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-medium text-muted-foreground mr-1">Risk:</span>
            {RISK_LEVELS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRisk(r.id)}
                className={`btn-pill text-xs px-2.5 py-1 ${selectedRisk === r.id ? "" : "btn-pill--ghost"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location Directory Cards Grid */}
      {error ? (
        <div className="section-card p-6 text-center text-destructive">
          <AlertTriangle size={24} className="mx-auto mb-2" />
          <p className="font-semibold text-sm m-0">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          <p>Filtering sentinel nodes & running neural prediction trajectories...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="section-card p-10 text-center">
          <Filter size={32} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">No Monitored Sentinel Locations Match</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Try expanding your search query, selecting "All Provinces", or clearing active filters.
          </p>
          <button type="button" className="btn-pill text-xs" onClick={handleClearFilters}>
            Clear All Filters
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
                {/* Card Top: Location & Risk Badge */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${riskBadge}`}>
                        {loc.riskLevel === "high" && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />}
                        {loc.riskLevel} Risk
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

                  {/* Epidemiological Metrics Strip */}
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
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Surge Probability</span>
                      <div className={`font-mono text-lg font-bold mt-0.5 ${loc.riskLevel === "high" ? "text-destructive" : "text-amber-500"}`}>
                        {Math.round(loc.outbreakProbability * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={13} className="shrink-0" />
                    <span className="truncate">Sentinel: {loc.sentinelFacility}</span>
                  </div>
                </div>

                {/* Card Action Link */}
                <div className="border-t border-border pt-3">
                  <Link
                    to={`/forecast/${loc.id}?disease=${encodeURIComponent(loc.disease)}`}
                    className="btn-pill w-full justify-center text-xs py-2 gap-1.5 no-underline"
                  >
                    <span>Examine Trajectory</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
