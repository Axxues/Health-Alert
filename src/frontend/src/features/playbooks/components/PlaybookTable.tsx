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
      <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--mute)" }}>
        No outbreak playbooks registered in the response catalog.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {items.map((p) => {
        const details = PLAYBOOK_DETAILS.default;

        return (
          <div
            key={p.id}
            className="card card--lift"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              border: "1px solid var(--hairline)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="glyph" style={{ width: 40, height: 40, borderRadius: 10 }}>
                  <Workflow size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="kbd" style={{ fontSize: "11px" }}>{p.code}</span>
                    <span className="pill pill--primary" style={{ fontSize: "11px" }}>Ready for Field Deployment</span>
                  </div>
                  <h3 style={{ fontSize: 18, margin: "4px 0 0", color: "var(--ink)" }}>{p.title}</h3>
                </div>
              </div>

              <button
                className="btn-pill"
                onClick={() => onExecute(p.id)}
                style={{ minHeight: 38, padding: "8px 18px" }}
              >
                <Play size={14} strokeWidth={2.5} />
                <span>Execute Playbook</span>
              </button>
            </div>

            <p className="sub" style={{ margin: 0 }}>
              {details.desc}
            </p>

            <div
              style={{
                background: "var(--card-subtle)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--mute)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <ListChecks size={14} strokeWidth={2.2} />
                <span>Standard Operating Procedure (SOP) Action Checklist</span>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {details.steps.map((st, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", color: "var(--ink)" }}>
                    <CheckCircle2 size={14} strokeWidth={2.2} style={{ color: "var(--green)", flex: "none" }} />
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
