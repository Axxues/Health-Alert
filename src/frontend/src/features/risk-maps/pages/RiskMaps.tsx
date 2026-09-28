import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { PHMap } from "../components/PHMap";

function levelPill(level: string) {
  if (/high/i.test(level)) return <span className="pill pill--bad">High</span>;
  if (/med|moderate/i.test(level)) return <span className="pill pill--warn">Watch</span>;
  return <span className="pill pill--ok">Routine</span>;
}

export function RiskMaps() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots().then(setSpots).catch(() => setError("Could not load the map. Try again."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="dash-head anim" style={{ marginBottom: 0, "--i": 0 } as React.CSSProperties}>
        <div>
          <h1>Streets to watch</h1>
          <p className="sub">Outbreaks across the Philippines — select a marker for details.</p>
        </div>
      </div>
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}
      <div className={`maplayout${selected ? " maplayout--open" : ""}`}>
        <div className="card card--lift anim" style={{ "--i": 1 } as React.CSSProperties}>
          {spots.length === 0 && !error
            ? <p className="muted">No hotspots right now. Check back after the next run.</p>
            : <PHMap spots={spots} selected={selected} onSelect={setSelected} />}
        </div>
        {selected && (
          <div className="card anim" key={`${selected.muni}-${selected.disease}`} style={{ "--i": 2 } as React.CSSProperties}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <h3 style={{ fontSize: 18 }}>{selected.muni}</h3>
              <button className="iconbtn" onClick={() => setSelected(null)} aria-label="Close details">✕</button>
            </div>
            <p style={{ margin: "8px 0 14px" }}>{levelPill(selected.level)}</p>
            <ul className="rows" style={{ marginTop: 0 }}>
              <li><div className="meta"><p>Disease</p><small style={{ textTransform: "capitalize" }}>{selected.disease}</small></div></li>
              <li><div className="meta"><p>Risk level</p><small style={{ textTransform: "capitalize" }}>{selected.level}</small></div></li>
              <li><div className="meta"><p>Coordinates</p><small className="tabular">{selected.lat.toFixed(2)}, {selected.lng.toFixed(2)}</small></div></li>
            </ul>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <Link className="btn-pill" to="/forecast" style={{ textDecoration: "none" }}>Open forecast</Link>
              <Link className="btn-pill btn-pill--ghost" to="/playbooks" style={{ textDecoration: "none" }}>Open playbooks</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
