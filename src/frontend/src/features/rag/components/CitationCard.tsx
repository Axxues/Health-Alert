import { BookOpen, FileText } from "lucide-react";
import type { RagCitation } from "@/services/rag/types";

export function CitationCard({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) return null;

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hairline)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--mute)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 10,
        }}
      >
        <BookOpen size={14} strokeWidth={2.2} />
        <span>Official Epidemiological Citations & Literature</span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {citations.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "var(--backdrop)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
            }}
          >
            <div className="glyph" style={{ width: 28, height: 28, borderRadius: 6 }}>
              <FileText size={15} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.doc}</span>
              <span style={{ color: "var(--mute)", marginLeft: 6 }}>
                · {c.chapter} · Page {c.page}
              </span>
            </div>
            <span className="pill pill--ok" style={{ fontSize: "11px" }}>
              Verified Source
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
