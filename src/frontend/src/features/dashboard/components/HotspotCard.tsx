import type { Hotspot } from "@/services/riskmaps";

// ponytail: pure list, no fetch inside
export function HotspotCard({ spots }: { spots: Hotspot[] }) {
  if (spots.length === 0) return <p className="muted">No hotspots right now. Check back after the next run.</p>;
  return (
    <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 8 }}>
      {spots.map((s) => (
        <li key={`${s.muni}-${s.disease}`} className="card" style={{ padding: 16 }}>
          <span className="tabular" style={{ fontWeight: 400 }}>{s.muni}</span>
          <span className="muted"> · {s.disease} · {s.level}</span>
        </li>
      ))}
    </ul>
  );
}
