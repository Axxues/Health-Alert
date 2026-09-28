import type { Hotspot } from "@/services/riskmaps";

export function HotspotTable({ spots }: { spots: Hotspot[] }) {
  if (spots.length === 0) return <p className="muted">No hotspots right now.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr className="muted" style={{ textAlign: "left" }}>
          <th style={{ padding: "8px 0", fontWeight: 400 }}>Place</th>
          <th style={{ padding: "8px 0", fontWeight: 400 }}>Disease</th>
          <th style={{ padding: "8px 0", fontWeight: 400 }}>Level</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {spots.map((s) => (
          <tr key={`${s.muni}-${s.disease}`} style={{ borderTop: "1px solid var(--hairline)" }}>
            <td style={{ padding: "8px 0" }}>{s.muni}</td>
            <td style={{ padding: "8px 0" }}>{s.disease}</td>
            <td style={{ padding: "8px 0" }}>{s.level}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
