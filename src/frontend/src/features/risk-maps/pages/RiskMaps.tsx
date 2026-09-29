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
      <span className="pill pill--bad">
        <span className="dot dot--pulse" />
        High Outbreak Risk
      </span>
    );
  }
  if (/med|moderate/i.test(level)) {
    return <span className="pill pill--warn">Elevated Watch</span>;
  }
  return <span className="pill pill--ok">Routine Surveillance</span>;
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
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <Layers size={13} strokeWidth={2.2} />
              Geospatial Outbreak Matrix
            </span>
          </div>
          <h1>Geographic Disease Risk & Hotspots</h1>
          <p className="sub">
            Spatial epidemiology overlay mapping high-transmission clusters and environmental hazard zones across LGUs.
          </p>
        </div>
      </div>

      {/* Disease Layer Filter Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--card)",
          padding: "8px 14px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--hairline)",
          overflowX: "auto",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginRight: 6 }}>
          DISEASE LAYER:
        </span>
        {DISEASE_FILTERS.map((d) => (
          <button
            key={d}
            className={`tab-btn ${filter === d ? "active" : ""}`}
            onClick={() => {
              setFilter(d);
              setSelected(null);
            }}
            type="button"
            style={{ fontSize: "12.5px", padding: "6px 14px", textTransform: "capitalize" }}
          >
            {d === "all" ? "All Diseases (Full Overlay)" : d}
          </button>
        ))}
      </div>

      {error && (
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
          <AlertCircle size={18} strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      {/* Map + Hotspot Details Drawer */}
      <div className={`maplayout${selected ? " maplayout--open" : ""}`}>
        <div className="card card--lift" style={{ minHeight: 480 }}>
          {filteredSpots.length === 0 && !error ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--mute)" }}>
              No active hotspots found for the selected disease filter.
            </div>
          ) : (
            <PHMap spots={filteredSpots} selected={selected} onSelect={setSelected} />
          )}
        </div>

        {selected && (
          <div
            className="card anim"
            key={`${selected.muni}-${selected.disease}`}
            style={{
              position: "sticky",
              top: 80,
              boxShadow: "var(--shadow-lift)",
              border: "1px solid var(--primary-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Selected Hotspot
                </span>
                <h3 style={{ fontSize: 20, margin: "2px 0 0", color: "var(--ink)" }}>{selected.muni}</h3>
              </div>
              <button
                className="iconbtn"
                onClick={() => setSelected(null)}
                aria-label="Close hotspot panel"
                title="Close hotspot panel"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <div style={{ margin: "10px 0 16px" }}>
              {levelPill(selected.level)}
            </div>

            <ul className="rows" style={{ margin: "0 0 16px" }}>
              <li>
                <div className="glyph">
                  <MapPin size={16} strokeWidth={2.2} />
                </div>
                <div className="meta">
                  <p>Target Syndrome</p>
                  <small style={{ textTransform: "capitalize" }}>{selected.disease}</small>
                </div>
              </li>
              <li>
                <div className="glyph">
                  <Compass size={16} strokeWidth={2.2} />
                </div>
                <div className="meta">
                  <p>Geographic Centroid</p>
                  <small className="tabular">{selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E</small>
                </div>
              </li>
              <li>
                <div className="glyph">
                  <TrendingUp size={16} strokeWidth={2.2} />
                </div>
                <div className="meta">
                  <p>Surveillance Status</p>
                  <small>Active transmission detected</small>
                </div>
              </li>
            </ul>

            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              <Link
                className="btn-pill"
                to="/forecast"
                style={{ textDecoration: "none", fontSize: "13px" }}
              >
                <span>Run Forecast for {selected.muni}</span>
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
              <Link
                className="btn-pill btn-pill--ghost"
                to="/playbooks"
                style={{ textDecoration: "none", fontSize: "13px" }}
              >
                <Workflow size={15} strokeWidth={2.2} />
                <span>Trigger Outbreak Playbook</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
