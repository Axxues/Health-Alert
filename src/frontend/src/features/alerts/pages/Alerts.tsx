import { useEffect, useMemo, useState } from "react";
import { ackAlert, broadcastAlert, listAlerts } from "@/services/alerts/api/alerts.api";
import type { Alert } from "@/services/alerts/types/alerts.types";
import { getRole } from "@/utils/auth";

const MUNIS = ["San Fernando City", "Agoo", "Bauang", "Bacnotan", "San Juan"];

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [muni, setMuni] = useState(MUNIS[0]);
  const [message, setMessage] = useState("");
  const [playbookCode, setPlaybookCode] = useState("");
  const [sending, setSending] = useState(false);

  const isAdmin = getRole() === "Admin";

  const refresh = () => {
    setLoading(true);
    setError("");
    listAlerts()
      .then(setAlerts)
      .catch(() => setError("Failed to retrieve alert ledger."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (kind === "all" || a.kind.toLowerCase() === kind) &&
          (status === "all" || a.status.toLowerCase() === status)
      ),
    [alerts, kind, status]
  );

  const openAuto = alerts.filter((a) => a.kind.toLowerCase() === "auto" && a.status.toLowerCase() === "new").length;
  const openManual = alerts.filter((a) => a.kind.toLowerCase() === "manual" && a.status.toLowerCase() === "new").length;

  const handleAck = async (id: number) => {
    await ackAlert(id).catch(() => setError("Failed to acknowledge alert."));
    refresh();
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await broadcastAlert({ muni, message: message.trim(), playbookCode: playbookCode.trim() || null })
      .then(() => {
        setMessage("");
        setPlaybookCode("");
        refresh();
      })
      .catch(() => setError("Failed to broadcast alert."))
      .finally(() => setSending(false));
  };

  const selectClass =
    "bg-transparent border border-input rounded-md text-xs text-foreground focus:outline-none cursor-pointer px-2.5 py-2 shadow-xs";

  return (
    <div className="page-doc" style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Alerts
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>
          {alerts.length} alerts, {openAuto} open auto, {openManual} open manual
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClass} aria-label="Kind">
          <option value="all">All kinds</option>
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="acked">Acked</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {error ? (
        <p style={{ fontSize: "13px", color: "var(--red)" }}>{error}</p>
      ) : loading ? (
        <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
          Loading alert ledger...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
          No alerts match.
        </p>
      ) : (
        <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflowX: "auto", background: "var(--card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline)", background: "var(--muted)" }}>
                {(["Kind", "Place", "Disease", "Message", "Status"] as const).map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--mute)",
                      padding: "10px 16px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th style={{ width: 120 }} aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "11px 16px", textTransform: "capitalize", whiteSpace: "nowrap" }}>{a.kind}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>{a.muni}</td>
                  <td style={{ padding: "11px 16px", color: "var(--ink)", whiteSpace: "nowrap" }}>{a.disease}</td>
                  <td style={{ padding: "11px 16px", color: "var(--ink)" }}>{a.message}</td>
                  <td style={{ padding: "11px 16px", textTransform: "capitalize", whiteSpace: "nowrap" }}>{a.status}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {a.status.toLowerCase() === "new" && (
                      <button type="button" className="btn-pill text-xs" onClick={() => handleAck(a.id)}>
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <div className="section-card" style={{ padding: 20, display: "grid", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Broadcast alert</h3>
          <select value={muni} onChange={(e) => setMuni(e.target.value)} className={selectClass} aria-label="Municipality">
            {MUNIS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Alert message..."
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: 10, background: "var(--background)", border: "1px solid var(--input)", borderRadius: 8, fontSize: "13px", color: "var(--ink)" }}
          />
          <input
            type="text"
            value={playbookCode}
            onChange={(e) => setPlaybookCode(e.target.value)}
            placeholder="SOP code (optional)"
            style={{ width: "100%", boxSizing: "border-box", padding: 10, background: "var(--background)", border: "1px solid var(--input)", borderRadius: 8, fontSize: "13px", color: "var(--ink)" }}
          />
          <div>
            <button type="button" className="btn-pill text-xs" onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
