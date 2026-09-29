import { BookOpen, FileText } from "lucide-react";
import type { RagCitation } from "@/services/rag/types";

export function CitationCard({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
        <BookOpen size={14} strokeWidth={2} />
        <span>Official Epidemiological Citations & Literature</span>
      </div>

      <div className="grid gap-2">
        {citations.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText size={14} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground">{c.doc}</span>
              <span className="text-muted-foreground ml-1.5">
                · {c.chapter} · Page {c.page}
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold">
              Verified Source
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
