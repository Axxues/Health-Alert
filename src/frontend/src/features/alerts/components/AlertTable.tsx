import { Bell, CheckCheck, ShieldCheck } from "lucide-react";
import type { HealthAlert } from "@/services/alerts/types";

export function AlertTable({
  items,
  onAck,
}: {
  items: HealthAlert[];
  onAck: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--mute)" }}>
        <ShieldCheck size={36} strokeWidth={1.8} style={{ color: "var(--green)", marginBottom: 10 }} />
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>All Surveillance Clear</div>
        <p style={{ margin: "4px 0 0", fontSize: "13.5px" }}>
          No unacknowledged outbreak alerts or syndromic anomalies detected.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Alert Details & Advisory</th>
            <th>Syndrome / Code</th>
            <th>Triage Status</th>
            <th>Assigned Action</th>
            <th style={{ textAlign: "right" }}>Resolution</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {items.map((a) => {
            const isAcked = a.status === "acked";

            return (
              <tr key={a.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      className="glyph"
                      style={{
                        background: isAcked ? "var(--green-bg)" : "var(--red-bg)",
                        color: isAcked ? "var(--green)" : "var(--red)",
                      }}
                    >
                      <Bell size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "14px" }}>
                        {a.message}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--mute)" }}>
                        Incident Alert #{a.id} · Local Epidemiological Unit
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="kbd" style={{ fontSize: "11.5px" }}>
                    {a.diseaseId ? `DISEASE-${a.diseaseId}` : "SYNDROMIC-CLUSTER"}
                  </span>
                </td>
                <td>
                  {isAcked ? (
                    <span className="pill pill--ok">
                      <ShieldCheck size={12} strokeWidth={2.5} />
                      Acknowledged
                    </span>
                  ) : (
                    <span className="pill pill--bad">
                      <span className="dot dot--pulse" />
                      Pending Action
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ fontSize: "12.5px", color: "var(--ink-secondary)" }}>
                    Deploy BHW Field Team & Dispatch SMS
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {!isAcked ? (
                    <button
                      className="btn-pill"
                      onClick={() => onAck(a.id)}
                      style={{ minHeight: 32, padding: "4px 14px", fontSize: "12px", gap: 5 }}
                    >
                      <CheckCheck size={14} strokeWidth={2.2} />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--mute)" }}>Resolved</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
