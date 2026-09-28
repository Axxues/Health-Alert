import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listHotspots } from "@/services/riskmaps/api/riskmaps.api";
import type { Hotspot } from "@/services/riskmaps";
import { HotspotCard } from "../components/HotspotCard";

export function DashboardPage() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listHotspots().then(setSpots).catch(() => setError("Could not load the map. Try again."));
  }, []);

  return (
    <div>
      <section className="hero-mesh" style={{ borderRadius: 12, padding: "32px 24px", color: "#fff" }}>
        <h1 className="display" style={{ fontSize: 32, margin: "0 0 8px", maxWidth: "22ch" }}>
          Where risk is rising today
        </h1>
        <p style={{ margin: 0, maxWidth: "60ch", opacity: 0.9 }}>
          Live hotspots for dengue, leptospirosis, flu-like illness, and asthma.
        </p>
      </section>
      <div className="card" style={{ marginTop: 16 }}>
        {error ? <p style={{ color: "var(--ruby)", margin: 0 }}>{error}</p> : <HotspotCard spots={spots} />}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Link className="btn-pill" to="/forecast" style={{ textDecoration: "none", display: "inline-block", lineHeight: "24px" }}>
            See the outlook
          </Link>
          <Link className="btn-pill btn-pill--ghost" to="/alerts" style={{ textDecoration: "none", display: "inline-block", lineHeight: "24px" }}>
            Review alerts
          </Link>
        </div>
      </div>
    </div>
  );
}
