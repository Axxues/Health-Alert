import { Link } from "react-router";
import { Workflow, Play, CheckCircle2, ArrowRight } from "lucide-react";
import type { Playbook } from "@/services/playbook/types";

export function PlaybooksCard({
  books,
  ran,
  onRun,
}: {
  books: Playbook[];
  ran: Set<number>;
  onRun: (id: number) => void;
}) {
  const list = books.slice(0, 3);

  return (
    <div className="card card--lift anim" style={{ "--i": 9 } as React.CSSProperties}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
          <Workflow size={17} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          <span>Response Playbooks</span>
        </h3>
        <span className="pill pill--primary" style={{ fontSize: "11px" }}>
          SOPs Ready
        </span>
      </div>
      <p className="sub">
        {list.length === 0
          ? "No response playbooks configured."
          : "Trigger targeted field & community containment."}
      </p>

      {list.length > 0 && (
        <ul className="rows">
          {list.map((b) => (
            <li key={b.id}>
              <div className="glyph">
                <Workflow size={16} strokeWidth={2.2} />
              </div>
              <div className="meta">
                <p>{b.title}</p>
                <small className="tabular">{b.code}</small>
              </div>
              <span className="tail">
                {ran.has(b.id) ? (
                  <span className="pill pill--ok" style={{ gap: 4 }}>
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    <span>Dispatched</span>
                  </span>
                ) : (
                  <button
                    className="btn-pill"
                    onClick={() => onRun(b.id)}
                    style={{ minHeight: 32, padding: "4px 12px", fontSize: 12, gap: 5 }}
                  >
                    <Play size={12} strokeWidth={2.5} />
                    <span>Deploy</span>
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 14 }}>
        <Link
          to="/playbooks"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}
        >
          <span>Explore all SOP playbooks</span>
          <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}
