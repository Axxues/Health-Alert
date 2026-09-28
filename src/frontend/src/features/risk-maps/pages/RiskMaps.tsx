import { useEffect, useState } from "react";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { HotspotTable } from "../components/HotspotTable";

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
          <p className="sub">Every hotspot on the map, worst first.</p>
        </div>
      </div>
      <div className="card anim" style={{ "--i": 1 } as React.CSSProperties}>
        {error ? <p style={{ color: "var(--red)", margin: 0 }}>{error}</p> : <HotspotTable spots={spots} />}
      </div>
    </div>
  );
}
