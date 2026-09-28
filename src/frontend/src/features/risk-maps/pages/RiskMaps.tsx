import { useEffect, useState } from "react";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { HotspotTable } from "../components/HotspotTable";
import { PHMap } from "../components/PHMap";

export function RiskMaps() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots().then(setSpots).catch(() => setError("Could not load the map. Try again."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="dash-head anim" style={{ marginBottom: 0, "--i": 0 } as React.CSSProperties}>
        <div>
          <h1>Streets to watch</h1>
          <p className="sub">Outbreaks across the Philippines, worst first.</p>
        </div>
      </div>
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}
      <div className="card card--lift anim" style={{ "--i": 1 } as React.CSSProperties}>
        {spots.length === 0 && !error
          ? <p className="muted">No hotspots right now. Check back after the next run.</p>
          : <PHMap spots={spots} />}
      </div>
      <div className="card anim" style={{ "--i": 2 } as React.CSSProperties}>
        <HotspotTable spots={spots} />
      </div>
    </div>
  );
}
