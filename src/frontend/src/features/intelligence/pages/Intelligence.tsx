import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, AlertTriangle, Filter, ChevronRight, X } from "lucide-react";
import { listLocations } from "@/services/forecast/api/locations.api";
import type { LocationDiseaseEntry, LocationFilter } from "@/services/forecast/types/forecast.types";
import { listFeeds } from "@/services/surveillance/api";
import type { SurveillanceFeed } from "@/services/surveillance/types";
import { FeedTable } from "@/features/surveillance/components/FeedTable";

const PROVINCES = [
  "All Provinces",
  "Metro Manila (NCR)",
  "Pampanga",
  "Bulacan",
  "Cavite",
  "Laguna",
  "Batangas",
  "Cebu",
  "Bohol",
  "Iloilo",
  "Negros Occidental",
  "Davao del Sur",
  "Misamis Oriental",
  "Benguet",
  "La Union",
  "Pangasinan",
  "Ilocos Sur",
  "Ilocos Norte",
];

const MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  "Metro Manila (NCR)": ["All Municipalities", "Quezon City", "City of Manila", "Caloocan City", "Pasig City"],
  "Pampanga": ["All Municipalities", "City of San Fernando", "Angeles City"],
  "Bulacan": ["All Municipalities", "Malolos City", "Meycauayan City"],
  "Cavite": ["All Municipalities", "Dasmariñas City", "Imus City", "Bacoor City"],
  "Laguna": ["All Municipalities", "Santa Rosa City", "Calamba City", "San Pedro City"],
  "Batangas": ["All Municipalities", "Batangas City", "Lipa City"],
  "Cebu": ["All Municipalities", "Cebu City", "Mandaue City", "Lapu-Lapu City"],
  "Bohol": ["All Municipalities", "Tagbilaran City"],
  "Iloilo": ["All Municipalities", "Iloilo City"],
  "Negros Occidental": ["All Municipalities", "Bacolod City"],
  "Davao del Sur": ["All Municipalities", "Davao City"],
  "Misamis Oriental": ["All Municipalities", "Cagayan de Oro City"],
  "Benguet": ["All Municipalities", "Baguio City", "La Trinidad"],
  "La Union": ["All Municipalities", "San Fernando City", "Agoo", "Bauang", "Bacnotan", "Naguilian", "San Juan"],
  "Pangasinan": ["All Municipalities", "Dagupan City", "San Carlos City", "Urdaneta City", "Lingayen", "San Fabian", "Calasiao"],
  "Ilocos Sur": ["All Municipalities", "Vigan City", "Candon City", "Narvacan", "Tagudin"],
  "Ilocos Norte": ["All Municipalities", "Laoag City", "Batac City", "San Nicolas", "Dingras"],
};

const DISEASES = [
  { id: "all", label: "All diseases" },
  { id: "dengue", label: "Dengue" },
  { id: "leptospirosis", label: "Leptospirosis" },
  { id: "ili", label: "Influenza-like (ILI)" },
  { id: "asthma", label: "Bronchial asthma" },
];

const RISK_LEVELS = [
  { id: "all", label: "Any risk" },
  { id: "high", label: "High risk" },
  { id: "moderate", label: "Moderate watch" },
  { id: "low", label: "Routine baseline" },
];

type Tab = "locations" | "pipelines";

function riskColor(risk: string) {
  return risk === "high" ? "var(--red)" : risk === "moderate" ? "var(--amber)" : "var(--green)";
}

export function Intelligence() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationDiseaseEntry[]>([]);
  const [feeds, setFeeds] = useState<SurveillanceFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("locations");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [selectedMunicipality, setSelectedMunicipality] = useState("All Municipalities");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");

  useEffect(() => {
    listFeeds().then(setFeeds).catch(() => {});
  }, []);

  useEffect(() => {
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
      .then(setLocations)
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "Failed to retrieve location intelligence directory."))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedProvince, selectedMunicipality, selectedDisease, selectedRisk]);

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

  const availableMunicipalities = useMemo(() => {
    if (selectedProvince === "All Provinces") {
      const allMunis = Object.values(MUNICIPALITIES_BY_PROVINCE).flatMap((list) =>
        list.filter((m) => m !== "All Municipalities")
      );
      return ["All Municipalities", ...Array.from(new Set(allMunis))];
    }
    return MUNICIPALITIES_BY_PROVINCE[selectedProvince] || ["All Municipalities"];
  }, [selectedProvince]);

  const highRiskCount = locations.filter((l) => l.riskLevel === "high").length;
  const totalCases = locations.reduce((sum, l) => sum + l.activeCases, 0);

  const selectClass =
    "bg-transparent border border-input rounded-md text-xs text-foreground focus:outline-none cursor-pointer px-2.5 py-2 shadow-xs";

  return (
    <div className="page-doc" style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Disease intelligence
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>
          {locations.length} monitored places, {highRiskCount} high risk, {totalCases} active cases, {feeds.length || 10} pipelines reporting
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--hairline)" }}>
        {(
          [
            { id: "locations", label: `Locations (${locations.length})` },
            { id: "pipelines", label: `Pipelines (${feeds.length || 10})` },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              color: tab === t.id ? "var(--ink)" : "var(--mute)",
              fontSize: "13px",
              fontWeight: tab === t.id ? 700 : 500,
              padding: "0 2px 8px",
              marginBottom: -1,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipelines" ? (
        <div className="section-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground m-0">Ingest pipelines</h3>
              <p className="text-xs text-muted-foreground m-0">Synced with DOH RA 11332 mandatory reporting standards.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              {feeds.length || 10} verified sources
            </span>
          </div>
          <div className="p-6">
            <FeedTable feeds={feeds} />
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mute)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search barangay, municipality, or disease..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 32px 8px 36px", background: "var(--background)", border: "1px solid var(--input)", borderRadius: 8, fontSize: "13px", color: "var(--ink)" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--mute)", cursor: "pointer", display: "flex" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select value={selectedProvince} onChange={(e) => handleProvinceChange(e.target.value)} className={selectClass} aria-label="Province">
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            <select value={selectedMunicipality} onChange={(e) => setSelectedMunicipality(e.target.value)} className={selectClass} aria-label="Municipality">
              {availableMunicipalities.map((muni) => (
                <option key={muni} value={muni}>{muni}</option>
              ))}
            </select>
            <select value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)} className={selectClass} aria-label="Disease">
              {DISEASES.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)} className={selectClass} aria-label="Risk level">
              {RISK_LEVELS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
              >
                Reset
              </button>
            )}
          </div>

          {error ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--red)", fontSize: "13px" }}>
              <AlertTriangle size={22} style={{ marginBottom: 6 }} />
              <p style={{ fontWeight: 600, margin: "0 0 12px" }}>{error}</p>
              <button type="button" className="btn-pill text-xs" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : loading ? (
            <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
              Filtering sentinel nodes and running prediction trajectories...
            </p>
          ) : locations.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Filter size={28} style={{ color: "var(--mute)", marginBottom: 10 }} />
              <p style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>No locations match</p>
              <p style={{ fontSize: "12.5px", color: "var(--mute)", margin: "0 0 14px" }}>Try a wider search or clear the filters.</p>
              <button type="button" className="btn-pill text-xs" onClick={handleClearFilters}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflowX: "auto", background: "var(--card)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--hairline)", background: "var(--muted)" }}>
                    {(["Barangay", "Disease", "Risk", "Active cases", "Week trend", "Surge probability"] as const).map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i >= 3 ? "right" : "left",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "var(--mute)",
                          padding: "10px 16px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                    <th style={{ width: 36 }} aria-label="Open record" />
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr
                      key={loc.id}
                      onClick={() => navigate(`/intelligence/${loc.id}?disease=${encodeURIComponent(loc.disease)}`)}
                      style={{ borderBottom: "1px solid var(--hairline)", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: riskColor(loc.riskLevel), marginRight: 8, verticalAlign: "baseline" }} aria-hidden="true" />
                        <span style={{ fontWeight: 700, color: "var(--ink)" }}>Brgy. {loc.barangay}</span>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--mute)", marginTop: 1 }}>
                          {loc.municipality}, {loc.province}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", color: "var(--ink)" }}>{loc.diseaseName}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: riskColor(loc.riskLevel), textTransform: "capitalize", whiteSpace: "nowrap" }}>
                        {loc.riskLevel}
                      </td>
                      <td className="tabular" style={{ padding: "11px 16px", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>
                        {loc.activeCases}
                      </td>
                      <td className="tabular" style={{ padding: "11px 16px", textAlign: "right", fontWeight: 600, color: loc.changePercent > 0 ? "var(--red)" : "var(--green)", whiteSpace: "nowrap" }}>
                        {loc.changePercent > 0 ? `+${loc.changePercent}%` : `${loc.changePercent}%`}
                      </td>
                      <td className="tabular" style={{ padding: "11px 16px", textAlign: "right", fontWeight: 800, fontSize: "14px", color: riskColor(loc.riskLevel), whiteSpace: "nowrap" }}>
                        {Math.round(loc.outbreakProbability * 100)}%
                      </td>
                      <td style={{ padding: "11px 12px 11px 4px" }}>
                        <ChevronRight size={16} style={{ color: "var(--mute)", display: "block" }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
