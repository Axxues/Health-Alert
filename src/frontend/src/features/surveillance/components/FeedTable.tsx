import type { SurveillanceFeed } from "@/services/surveillance";

export function FeedTable({ feeds }: { feeds: SurveillanceFeed[] }) {
  if (feeds.length === 0) return <p className="muted">No feeds yet.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr className="muted" style={{ textAlign: "left" }}>
          <th style={{ padding: "8px 0", fontWeight: 400 }}>Feed</th>
          <th style={{ padding: "8px 0", fontWeight: 400 }}>Code</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {feeds.map((f) => (
          <tr key={f.id} style={{ borderTop: "1px solid var(--hairline)" }}>
            <td style={{ padding: "8px 0" }}>{f.name}</td>
            <td style={{ padding: "8px 0" }}>{f.code}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
