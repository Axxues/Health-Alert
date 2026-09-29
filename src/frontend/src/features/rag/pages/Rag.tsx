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
    <div className="grid gap-5 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="dash-head m-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles size={13} strokeWidth={2.2} />
              AI Literature & Guidelines Assistant (RAG)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight m-0">Ask the Epidemiology Library</h1>
          <p className="text-xs text-muted-foreground m-0 mt-0.5">
            Grounded intelligence on DOH Clinical Practice Guidelines, WHO Outbreak Manuals, and LGU SOPs.
          </p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {SUGGESTED_QUERIES.map((sq, i) => (
          <button
            key={i}
            className="btn-pill btn-pill--ghost text-xs px-3 py-1 hover:border-primary/40 transition-colors"
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
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring shadow-sm"
          placeholder="Ask about clinical guidelines, dosage protocols, case definitions, or outbreak response..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="btn-pill text-xs px-5 py-2.5 gap-1.5 shrink-0"
          type="submit"
          disabled={loading || !q.trim()}
        >
          <Send size={14} strokeWidth={2} />
          <span>{loading ? "Searching..." : "Ask Assistant"}</span>
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-semibold">
          <AlertCircle size={16} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {/* AI Answer & Verified Citations Card */}
      {result && (
        <div className="section-card border-l-4 border-l-primary p-6 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bot size={17} strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">
                Epidemiological Assistant Response
              </div>
              <div className="text-xs text-muted-foreground">
                Grounded strictly in indexed Philippine DOH and WHO guidelines
              </div>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-foreground p-4 bg-muted/30 rounded-lg border border-border">
            {result.answer}
          </div>

          <CitationCard citations={result.citations} />
        </div>
      )}
    </div>
  );
}
