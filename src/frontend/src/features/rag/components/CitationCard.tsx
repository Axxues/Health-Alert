import type { RagCitation } from "@/services/rag/types";

export function CitationCard({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8 }}>
      {citations.map((c, i) => (
        <li key={i} className="card" style={{ padding: 12 }}>
          <span style={{ fontWeight: 400 }}>{c.doc}</span>
          <span className="muted"> · {c.chapter} · {c.page}</span>
        </li>
      ))}
    </ul>
  );
}
