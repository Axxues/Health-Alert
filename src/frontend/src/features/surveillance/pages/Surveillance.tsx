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
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="live-badge">
              <span className="dot dot--pulse" />
              Automated Data Pipeline Active
            </span>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              DOH PIDSR & PAGASA Ingestion
            </span>
          </div>
          <h1>Multi-Syndromic Surveillance & Monitored Sentinels</h1>
          <p className="sub">
            Real-time disease surveillance streams, clinical reporting health centers, and automated n8n pipeline telemetry across Region 1.
          </p>
        </div>

        <div className="dash-actions">
          <Link
            className="btn-pill btn-pill--ghost"
            to="/forecast"
            style={{ textDecoration: "none" }}
          >
            <TrendingUp size={16} strokeWidth={2.2} />
            <span>AI Forecast Models</span>
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Surveillance Feed Telemetry Metrics */}
      <div className="stats">
        <div className="stat stat--hero">
          <div className="lbl">
            <span>24h Ingested Records</span>
            <Database size={18} strokeWidth={2.2} />
          </div>
          <p className="num tabular">14,820</p>
          <div className="trend">
            <span>EDCS-IS, PAGASA, & Clinics</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Monitored Sentinels</span>
            <MapPin size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          </div>
          <p className="num tabular">{locations.length}</p>
          <div className="trend">
            <span>Active clinical intake</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Pipeline Ingest Latency</span>
            <Zap size={18} strokeWidth={2.2} style={{ color: "var(--amber)" }} />
          </div>
          <p className="num tabular">
            380<span style={{ fontSize: 20 }}>ms</span>
          </p>
          <div className="trend">
            <span>Sub-second streaming</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Active Pipelines</span>
            <Radio size={18} strokeWidth={2.2} style={{ color: "var(--green)" }} />
          </div>
          <p className="num tabular">{feeds.length || 10}</p>
          <div className="trend">
            <span>100% Ingestion Uptime</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Sentinels Matrix vs. Ingestion Pipelines */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--hairline)", paddingBottom: 10 }}>
        <button
          type="button"
          onClick={() => setActiveTab("locations")}
          className={`btn-pill ${activeTab === "locations" ? "" : "btn-pill--ghost"}`}
          style={{ fontSize: "13px" }}
        >
          <MapPin size={14} />
          <span>Monitored Sentinel Locations ({locations.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pipelines")}
          className={`btn-pill ${activeTab === "pipelines" ? "" : "btn-pill--ghost"}`}
          style={{ fontSize: "13px" }}
        >
          <Radio size={14} />
          <span>Ingestion Pipelines ({feeds.length || 10})</span>
        </button>
      </div>

      {activeTab === "locations" ? (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Location Filters Bar */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
              {/* Search Bar */}
              <div style={{ flex: "1 1 260px", minWidth: 240, position: "relative" }}>
                <Search
                  size={15}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mute)" }}
                />
                <input
                  type="text"
                  placeholder="Filter sentinels by barangay, municipality, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 12px 7px 34px",
                    background: "var(--card-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--ink)",
                    fontSize: "13px",
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
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Geographic Dropdowns */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 size={14} style={{ color: "var(--mute)" }} />
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      background: "var(--card-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--ink)",
                      fontSize: "12.5px",
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
                  <MapPin size={14} style={{ color: "var(--mute)" }} />
                  <select
                    value={selectedMunicipality}
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      background: "var(--card-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--ink)",
                      fontSize: "12.5px",
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
                    style={{ fontSize: "12px", padding: "5px 10px" }}
                  >
                    <RefreshCw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Disease Filter Pills */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", color: "var(--mute)", marginRight: 4 }}>Tracked Disease:</span>
              {DISEASES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDisease(d.id)}
                  className={`btn-pill ${selectedDisease === d.id ? "" : "btn-pill--ghost"}`}
                  style={{ fontSize: "11.5px", padding: "3px 9px" }}
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
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <div>
                          <span className={`pill ${riskPillClass}`} style={{ fontSize: "11px", marginBottom: 6 }}>
                            {loc.riskLevel.toUpperCase()} WATCH
                          </span>
                          <h3 style={{ margin: "4px 0 2px", fontSize: "17px", fontWeight: 700 }}>
                            Brgy. {loc.barangay}
                          </h3>
                          <p className="sub" style={{ fontSize: "12.5px", margin: 0 }}>
                            {loc.municipality}, {loc.province}
                          </p>
                        </div>

                        <span className="pill pill--primary" style={{ fontSize: "11px" }}>
                          {loc.diseaseName}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 10,
                          padding: "10px 12px",
                          background: "var(--card-subtle)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--hairline)",
                          marginTop: 10,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Active Cases</span>
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
                          <span style={{ fontSize: "11px", color: "var(--mute)", display: "block" }}>Sentinel Node</span>
                          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {loc.sentinelFacility}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 8, fontSize: "11.5px", color: "var(--mute)", display: "flex", alignItems: "center", gap: 5 }}>
                        <CheckCircle2 size={13} style={{ color: "var(--green)" }} />
                        <span>PIDSR Stream Live · Synced {loc.lastUpdated}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12 }}>
                      <Link
                        to={`/surveillance/${loc.id}?disease=${encodeURIComponent(loc.disease)}`}
                        className="btn-pill"
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          textDecoration: "none",
                          fontSize: "13px",
                          padding: "8px 14px",
                        }}
                      >
                        <span>View Surveillance Stream</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Main Ingestion Feed Card */
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Configured Ingest Pipelines</h3>
              <p className="sub">Synchronized with DOH RA 11332 mandatory reporting standards.</p>
            </div>
            <span className="pill pill--primary">{feeds.length || 10} Verified Sources</span>
          </div>

          {error ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: "var(--red-bg)",
                borderRadius: "var(--radius-md)",
                color: "var(--red)",
              }}
            >
              <AlertCircle size={16} strokeWidth={2.2} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
            </div>
          ) : (
            <FeedTable feeds={feeds} />
          )}
        </div>
      )}
    </div>
  );
}
