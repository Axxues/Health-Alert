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

      {/* Directory Quick Telemetry Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "8px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Monitored Sentinels</span>
            <span className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)" }}>{locations.length} Locations</span>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "8px", background: "var(--red-bg)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Surge Alert Zones</span>
            <span className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--red)" }}>{highRiskCount} High Risk</span>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "8px", background: "var(--amber-bg)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Active Monitored Cases</span>
            <span className="tabular" style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)" }}>{totalCases} Cases</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search Input */}
          <div style={{ flex: "1 1 280px", minWidth: 260, position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mute)" }}
            />
            <input
              type="text"
              placeholder="Search barangay, municipality, province, or disease..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                background: "var(--card-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--ink)",
                fontSize: "13.5px",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--mute)",
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Geographic Selects */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={15} style={{ color: "var(--mute)" }} />
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                style={{
                  padding: "7px 12px",
                  background: "var(--card-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--ink)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={15} style={{ color: "var(--mute)" }} />
              <select
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                style={{
                  padding: "7px 12px",
                  background: "var(--card-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--ink)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
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
                className="btn-pill btn-pill--ghost"
                onClick={handleClearFilters}
                style={{ fontSize: "12px", padding: "6px 10px" }}
              >
                <RefreshCw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Disease & Risk Band Pills */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--hairline)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          {/* Disease Filter Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--mute)", marginRight: 4 }}>Disease:</span>
            {DISEASES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDisease(d.id)}
                className={`btn-pill ${selectedDisease === d.id ? "" : "btn-pill--ghost"}`}
                style={{ fontSize: "12px", padding: "4px 10px" }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Risk Band Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--mute)", marginRight: 4 }}>Risk:</span>
            {RISK_LEVELS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRisk(r.id)}
                className={`btn-pill ${selectedRisk === r.id ? "" : "btn-pill--ghost"}`}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  color: selectedRisk === r.id ? undefined : r.color,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location Directory Cards Grid */}
      {error ? (
        <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--red)" }}>
          <AlertTriangle size={24} style={{ display: "inline-block", marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--mute)" }}>
          <p>Filtering sentinel nodes & running neural prediction trajectories...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <Filter size={32} style={{ color: "var(--mute)", display: "inline-block", marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 6px" }}>No Monitored Sentinel Locations Match</h3>
          <p className="sub" style={{ marginBottom: 16 }}>
            Try expanding your search query, selecting "All Provinces", or clearing active filters.
          </p>
          <button type="button" className="btn-pill" onClick={handleClearFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {locations.map((loc) => {
            const riskPillClass =
              loc.riskLevel === "high"
                ? "pill--bad"
                : loc.riskLevel === "moderate"
                ? "pill--warn"
                : "pill--ok";

            return (
              <div
                key={loc.id}
                className="card card--lift"
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                {/* Card Top: Location & Risk Badge */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div>
                      <span className={`pill ${riskPillClass}`} style={{ fontSize: "11px", marginBottom: 6 }}>
                        {loc.riskLevel === "high" && <span className="dot dot--pulse" />}
                        <span style={{ textTransform: "uppercase" }}>{loc.riskLevel} Risk</span>
                      </span>
                      <h3 style={{ margin: "4px 0 2px", fontSize: "17px", fontWeight: 700 }}>
                        Brgy. {loc.barangay}
                      </h3>
                      <p className="sub" style={{ fontSize: "12.5px", margin: 0 }}>
                        {loc.municipality}, {loc.province}
                      </p>
                    </div>

                    <span className="pill pill--primary" style={{ fontSize: "11px", textTransform: "capitalize" }}>
                      {loc.diseaseName}
                    </span>
                  </div>

                  {/* Epidemiological Metrics Strip */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 10,
                      padding: "10px 12px",
                      background: "var(--card-subtle)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--hairline)",
                      marginTop: 12,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Active Weekly Cases</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span className="tabular" style={{ fontSize: "18px", fontWeight: 800, color: "var(--ink)" }}>
                          {loc.activeCases}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: loc.changePercent > 0 ? "var(--red)" : "var(--green)",
                          }}
                        >
                          {loc.changePercent > 0 ? `+${loc.changePercent}%` : `${loc.changePercent}%`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Surge Probability</span>
                      <div className="tabular" style={{ fontSize: "18px", fontWeight: 800, color: loc.riskLevel === "high" ? "var(--red)" : "var(--amber)" }}>
                        {Math.round(loc.outbreakProbability * 100)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 5 }}>
                    <Building2 size={13} />
                    <span>Sentinel: {loc.sentinelFacility}</span>
                  </div>
                </div>

                {/* Card Action Link */}
                <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12 }}>
                  <Link
                    to={`/forecast/${loc.id}?disease=${encodeURIComponent(loc.disease)}`}
                    className="btn-pill"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      textDecoration: "none",
                      fontSize: "13px",
                      padding: "8px 14px",
                    }}
                  >
                    <span>Examine Trajectory</span>
                    <ChevronRight size={15} />
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
