import { Workflow, Play, CheckCircle2, ListChecks } from "lucide-react";
import type { Playbook } from "@/services/playbook/types";

const PLAYBOOK_DETAILS: Record<string, { desc: string; steps: string[]; priority: string }> = {
  default: {
    desc: "Targeted multi-stage outbreak mitigation protocol for local health units.",
    steps: [
      "Mobilize Barangay Health Workers (BHWs) for syndromic case monitoring",
      "Preposition Oral Rehydration Salts (ORS) & critical therapeutics at RHU",
      "Issue targeted community public health advisories via SMS broadcast",
      "Submit mandatory EDCS-IS linelist report to Provincial Epidemiology Unit",
    ],
    priority: "High",
  },
};

export function PlaybookTable({
  items,
  onExecute,
}: {
  items: Playbook[];
  onExecute: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        No outbreak playbooks registered in the response catalog.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((p) => {
        const details = PLAYBOOK_DETAILS.default;

        return (
          <div
            key={p.id}
            className="section-card border-l-4 border-l-primary p-6 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Workflow size={20} strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-foreground border border-border">{p.code}</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                      Ready for Field Deployment
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1 mb-0">{p.title}</h3>
                </div>
              </div>

              <button
                className="btn-pill text-xs px-4 py-2 gap-1.5"
                onClick={() => onExecute(p.id)}
              >
                <Play size={13} strokeWidth={2.5} />
                <span>Execute Playbook</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground m-0">
              {details.desc}
            </p>

            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                <ListChecks size={14} strokeWidth={2} />
                <span>Standard Operating Procedure (SOP) Action Checklist</span>
              </div>
              <div className="grid gap-2">
                {details.steps.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 size={14} strokeWidth={2.2} className="text-emerald-500 shrink-0" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
