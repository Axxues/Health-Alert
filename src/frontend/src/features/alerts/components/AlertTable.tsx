import type { HealthAlert } from "@/services/alerts";

export function AlertTable({ items, onAck }: { items: HealthAlert[]; onAck: (id: number) => void }) {
  if (items.length === 0) return <p className="muted">All clear. No alerts.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {items.map((a) => (
          <tr key={a.id} style={{ borderTop: "1px solid var(--hairline)" }}>
            <td style={{ padding: "12px 0" }}>
              {a.message} <span className="muted">· {a.status}</span>
            </td>
            <td style={{ padding: "12px 0", textAlign: "right" }}>
              {a.status !== "acked" && <button className="btn-pill btn-pill--ghost" onClick={() => onAck(a.id)}>Acknowledge</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
