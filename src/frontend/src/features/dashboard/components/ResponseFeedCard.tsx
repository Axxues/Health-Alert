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
    <div className="section-card anim" style={{ "--i": 6 } as React.CSSProperties}>
      <div className="section-card-head" style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className={`btn-pill ${tab === "alerts" ? "" : "btn-pill--ghost"}`}
            style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-md)" }}
            onClick={() => setTab("alerts")}
          >
            <Bell size={13} />
            <span>Active Alerts</span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "var(--radius-pill)",
                background: openAlerts.length > 0 ? "hsl(var(--warning-raw) / 0.15)" : "var(--hairline)",
                color: openAlerts.length > 0 ? "var(--amber)" : "var(--mute)",
              }}
            >
              {openAlerts.length}
            </span>
          </button>
          <button
            type="button"
            className={`btn-pill ${tab === "playbooks" ? "" : "btn-pill--ghost"}`}
            style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-md)" }}
            onClick={() => setTab("playbooks")}
          >
            <Workflow size={13} />
            <span>Field Playbooks</span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "var(--radius-pill)",
                background: "var(--hairline)",
                color: "var(--mute)",
              }}
            >
              {bookList.length}
            </span>
          </button>
        </div>
      </div>

      <div className="section-card-body">
        {tab === "alerts" ? (
          <div>
            {openAlerts.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--mute)" }}>
                <CheckCircle2 size={24} style={{ color: "var(--green)", display: "inline-block", marginBottom: 6 }} />
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>All Systems Clear</p>
                <small style={{ fontSize: "11.5px" }}>No active epidemiological alerts flagged.</small>
              </div>
            ) : (
              <ul className="rows">
                {openAlerts.map((a) => (
                  <li key={a.id} style={{ padding: "8px 10px" }}>
                    <div className="glyph" style={{ width: 30, height: 30, background: "hsl(var(--warning-raw) / 0.1)", color: "var(--amber)" }}>
                      <AlertCircle size={15} />
                    </div>
                    <div className="meta">
                      <p style={{ fontSize: "12.5px" }}>{a.message}</p>
                      <small style={{ fontSize: "11px" }}>{a.status === "acked" ? "Acknowledged" : "Active trigger"}</small>
                    </div>
                    <span className="tail">
                      <button
                        type="button"
                        className="btn-pill btn-pill--ghost"
                        onClick={() => onAck(a.id)}
                        style={{ minHeight: 28, padding: "2px 8px", fontSize: 11.5, gap: 4 }}
                        title="Acknowledge alert"
                      >
                        <CheckCheck size={12} />
                        <span>Ack</span>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--hairline)", textAlign: "right" }}>
              <Link
                to="/alerts"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}
              >
                <span>View all alerts</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <ul className="rows">
              {bookList.map((b) => (
                <li key={b.id} style={{ padding: "8px 10px" }}>
                  <div className="glyph" style={{ width: 30, height: 30, background: "hsl(var(--primary-raw) / 0.1)", color: "var(--primary)" }}>
                    <Workflow size={15} />
                  </div>
                  <div className="meta">
                    <p style={{ fontSize: "12.5px" }}>{b.title}</p>
                    <small style={{ fontSize: "11px" }}>Protocol code: {b.code}</small>
                  </div>
                  <span className="tail">
                    <button
                      type="button"
                      className={`btn-pill ${ran.has(b.id) ? "btn-pill--ghost" : ""}`}
                      onClick={() => onRun(b.id)}
                      disabled={ran.has(b.id)}
                      style={{ minHeight: 28, padding: "2px 10px", fontSize: 11.5, gap: 4 }}
                    >
                      {ran.has(b.id) ? (
                        <>
                          <CheckCircle2 size={12} style={{ color: "var(--green)" }} />
                          <span>Initiated</span>
                        </>
                      ) : (
                        <>
                          <Play size={11} />
                          <span>Execute</span>
                        </>
                      )}
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--hairline)", textAlign: "right" }}>
              <Link
                to="/playbooks"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}
              >
                <span>Browse all SOP playbooks</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
