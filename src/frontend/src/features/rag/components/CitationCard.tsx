import { FileText } from "lucide-react";
import type { RagCitation } from "@/services/rag/types";

export function CitationCard({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/70 pt-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground">Sources</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {citations.map((c, i) => (
          <span
            key={i}
            title={`${c.doc}, ${c.chapter}, page ${c.page}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-semibold text-foreground"
          >
            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {c.source ? `${c.source}: ` : ""}{c.doc}, {c.chapter}, p. {c.page}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
