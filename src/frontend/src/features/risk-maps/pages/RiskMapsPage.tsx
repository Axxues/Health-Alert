import { useEffect, useState } from "react";
import { listHotspots } from "@/services/riskmaps/api/riskmaps.api";
import type { Hotspot } from "@/services/riskmaps";
import { HotspotTable } from "../components/HotspotTable";

export function RiskMapsPage() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots().then(setSpots).catch(() => setError("Could not load the map. Try again."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="hero-mesh" style={{ borderRadius: 12, padding: "32px 24px", color: "#fff" }}>
        <h1 className="display" style={{ fontSize: 32, margin: 0, maxWidth: "22ch" }}>Streets to watch</h1>
      </section>
      <div className="card">
        {error ? <p style={{ color: "var(--ruby)", margin: 0 }}>{error}</p> : <HotspotTable spots={spots} />}
      </div>
    </div>
  );
}
