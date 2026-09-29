import { Link } from "react-router";
import { Bell, CheckCheck, AlertCircle, ArrowRight } from "lucide-react";
import type { HealthAlert } from "@/services/alerts/types";

export function AlertsCard({
  alerts,
  onAck,
}: {
  alerts: HealthAlert[];
  onAck: (id: number) => void;
}) {
  const open = alerts.filter((a) => a.status !== "acked").slice(0, 3);

  return (
    <div className="card card--lift anim" style={{ "--i": 8 } as React.CSSProperties}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
          <Bell size={17} strokeWidth={2.2} style={{ color: "var(--amber)" }} />
          <span>Pending Alerts</span>
        </h3>
        <span className={`pill ${open.length > 0 ? "pill--warn" : "pill--ok"}`}>
          {open.length > 0 ? `${open.length} Action Needed` : "All Clear"}
        </span>
      </div>
      <p className="sub">
        {open.length === 0
          ? "No unacknowledged alerts across local health facilities."
          : "Surveillance anomalies requiring epidemiological response."}
      </p>

      {open.length > 0 && (
        <ul className="rows">
          {open.map((a) => (
            <li key={a.id}>
              <div className="glyph" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
                <AlertCircle size={16} strokeWidth={2.2} />
              </div>
              <div className="meta">
                <p>{a.message}</p>
                <small>{a.status === "acked" ? "Acknowledged" : "Active trigger"}</small>
              </div>
              <span className="tail">
                <button
                  className="btn-pill btn-pill--ghost"
                  onClick={() => onAck(a.id)}
                  style={{ minHeight: 32, padding: "4px 10px", fontSize: 12, gap: 4 }}
                  title="Acknowledge alert"
                >
                  <CheckCheck size={14} strokeWidth={2.2} />
                  <span>Ack</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 14 }}>
        <Link
          to="/alerts"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}
        >
          <span>View all triage alerts</span>
          <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}
