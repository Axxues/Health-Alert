import { useState } from "react";
import { Link } from "react-router";
import { Bell, Workflow, AlertCircle, CheckCheck, Play, CheckCircle2, ArrowRight } from "lucide-react";
import type { HealthAlert } from "@/services/alerts/types";
import type { Playbook } from "@/services/playbook/types";

interface ResponseFeedCardProps {
  alerts: HealthAlert[];
  onAck: (id: number) => void;
  books: Playbook[];
  ran: Set<number>;
  onRun: (id: number) => void;
}

export function ResponseFeedCard({
  alerts,
  onAck,
  books,
  ran,
  onRun,
}: ResponseFeedCardProps) {
  const [tab, setTab] = useState<"alerts" | "playbooks">("alerts");

  const openAlerts = alerts.filter((a) => a.status !== "acked").slice(0, 4);
  const bookList = books.slice(0, 4);

  return (
    <div className="card card--lift anim" style={{ "--i": 6 } as React.CSSProperties}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="feed-tabs">
          <button
            type="button"
            className={`feed-tab ${tab === "alerts" ? "active" : ""}`}
            onClick={() => setTab("alerts")}
          >
            <Bell size={15} strokeWidth={2.2} />
            <span>Active Alerts</span>
            <span className={`pill-counter ${openAlerts.length > 0 ? "pill-counter--warn" : ""}`}>
              {openAlerts.length}
            </span>
          </button>
          <button
            type="button"
            className={`feed-tab ${tab === "playbooks" ? "active" : ""}`}
            onClick={() => setTab("playbooks")}
          >
            <Workflow size={15} strokeWidth={2.2} />
            <span>Field Playbooks</span>
            <span className="pill-counter">
              {bookList.length}
            </span>
          </button>
        </div>
      </div>

      {tab === "alerts" ? (
        <div>
          {openAlerts.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--mute)" }}>
              <div style={{ marginBottom: 6 }}>
                <CheckCircle2 size={28} strokeWidth={1.8} style={{ color: "var(--green)", display: "inline-block" }} />
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>All Systems Clear</p>
              <small style={{ fontSize: "12px", color: "var(--mute)" }}>
                No active epidemiological alerts or facility anomalies flagged.
              </small>
            </div>
          ) : (
            <ul className="rows">
              {openAlerts.map((a) => (
                <li key={a.id} style={{ padding: "10px 0" }}>
                  <div className="glyph" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
                    <AlertCircle size={16} strokeWidth={2.2} />
                  </div>
                  <div className="meta">
                    <p>{a.message}</p>
                    <small>{a.status === "acked" ? "Acknowledged" : "Active trigger · Requires verification"}</small>
                  </div>
                  <span className="tail">
                    <button
                      className="btn-pill btn-pill--ghost"
                      onClick={() => onAck(a.id)}
                      style={{ minHeight: 30, padding: "3px 10px", fontSize: 12, gap: 4 }}
                      title="Acknowledge alert"
                    >
                      <CheckCheck size={13} strokeWidth={2.2} />
                      <span>Ack</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
            <Link
              to="/alerts"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "13px", fontWeight: 600 }}
            >
              <span>Review all triage alerts</span>
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {bookList.length === 0 ? (
            <p className="muted" style={{ margin: "20px 0" }}>No response playbooks configured.</p>
          ) : (
            <ul className="rows">
              {bookList.map((b) => (
                <li key={b.id} style={{ padding: "10px 0" }}>
                  <div className="glyph" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    <Workflow size={16} strokeWidth={2.2} />
                  </div>
                  <div className="meta">
                    <p>{b.title}</p>
                    <small className="tabular">{b.code} · Field SOP</small>
                  </div>
                  <span className="tail">
                    {ran.has(b.id) ? (
                      <span className="pill pill--ok" style={{ gap: 4, fontSize: "11px" }}>
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        <span>Dispatched</span>
                      </span>
                    ) : (
                      <button
                        className="btn-pill"
                        onClick={() => onRun(b.id)}
                        style={{ minHeight: 30, padding: "3px 11px", fontSize: 12, gap: 5 }}
                      >
                        <Play size={11} strokeWidth={2.5} />
                        <span>Deploy</span>
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
            <Link
              to="/playbooks"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "13px", fontWeight: 600 }}
            >
              <span>Explore all SOP playbooks</span>
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
