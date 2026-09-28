import type { Playbook } from "@/services/playbook";

export function PlaybookTable({ items, onExecute }: { items: Playbook[]; onExecute: (id: number) => void }) {
  if (items.length === 0) return <p className="muted">No playbooks yet.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {items.map((p) => (
          <tr key={p.id} style={{ borderTop: "1px solid var(--hairline)" }}>
            <td style={{ padding: "12px 0" }}>{p.title}</td>
            <td style={{ padding: "12px 0", textAlign: "right" }}>
              <button className="btn-pill" onClick={() => onExecute(p.id)}>Run</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
