import { useState } from "react";
import { Sparkles, Send, Bot, AlertCircle } from "lucide-react";
import { askLibrary } from "@/services/rag/api";
import type { RagAnswer } from "@/services/rag/types";
import { CitationCard } from "../components/CitationCard";

const SUGGESTED_QUERIES = [
  "How do we manage dengue warning signs and fluid resuscitation?",
  "What is the DOH Doxycycline prophylaxis regimen for flood exposure?",
  "What are the EDCS-IS reporting deadlines for Category 1 outbreaks?",
  "What environmental threshold triggers the asthma surge response?",
];

export function Rag() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<RagAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(queryText: string) {
    if (!queryText.trim()) return;
    setError("");
    setLoading(true);
    try {
      setResult(await askLibrary(queryText));
    } catch {
      setError("Unable to query epidemiological library. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void handleAsk(q);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <Sparkles size={13} strokeWidth={2.2} />
              AI Literature & Guidelines Assistant (RAG)
            </span>
          </div>
          <h1>Ask the Epidemiology Library</h1>
          <p className="sub">
            Grounded intelligence on DOH Clinical Practice Guidelines, WHO Outbreak Manuals, and LGU SOPs.
          </p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--mute)", textTransform: "uppercase" }}>
          Suggested:
        </span>
        {SUGGESTED_QUERIES.map((sq, i) => (
          <button
            key={i}
            className="tab-btn"
            style={{ fontSize: "12px", padding: "5px 12px", background: "var(--card)" }}
            onClick={() => {
              setQ(sq);
              void handleAsk(sq);
            }}
            type="button"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Search Input Box */}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 10 }}>
        <input
          className="input"
          style={{ flex: 1, padding: "12px 18px", fontSize: "14px" }}
          placeholder="Ask about clinical guidelines, dosage protocols, case definitions, or outbreak response..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="btn-pill"
          type="submit"
          disabled={loading || !q.trim()}
          style={{ minHeight: 46, padding: "0 22px" }}
        >
          <Send size={15} strokeWidth={2.2} />
          <span>{loading ? "Searching..." : "Ask Assistant"}</span>
        </button>
      </form>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "var(--red-bg)",
            borderRadius: "var(--radius-md)",
            color: "var(--red)",
          }}
        >
          <AlertCircle size={18} strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      {/* AI Answer & Verified Citations Card */}
      {result && (
        <div className="card anim" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div className="glyph" style={{ width: 32, height: 32, borderRadius: 8 }}>
              <Bot size={17} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>
                Epidemiological Assistant Response
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--mute)" }}>
                Grounded strictly in indexed Philippine DOH and WHO guidelines
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "14.5px",
              lineHeight: 1.65,
              color: "var(--ink)",
              margin: "12px 0 16px",
              padding: "14px 18px",
              background: "var(--card-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--hairline)",
            }}
          >
            {result.answer}
          </div>

          <CitationCard citations={result.citations} />
        </div>
      )}
    </div>
  );
}
