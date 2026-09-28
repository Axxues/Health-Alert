import { useState } from "react";
import { askLibrary } from "@/services/rag/api";
import type { RagAnswer } from "@/services/rag/types";
import { CitationCard } from "../components/CitationCard";

export function Rag() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<RagAnswer | null>(null);
  const [error, setError] = useState("");

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setResult(await askLibrary(q));
    } catch {
      setError("Could not get an answer. Try again.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Ask the library</h1>
      <form onSubmit={onAsk} style={{ display: "flex", gap: 8 }}>
        <input className="input" style={{ flex: 1 }} placeholder="How do we manage dengue fluids?" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-pill" type="submit">Ask</button>
      </form>
      {error && <p style={{ color: "var(--red)", margin: 0 }}>{error}</p>}
      {result && (
        <div className="card">
          <p style={{ margin: 0, maxWidth: "70ch" }}>{result.answer}</p>
          <CitationCard citations={result.citations} />
        </div>
      )}
    </div>
  );
}
