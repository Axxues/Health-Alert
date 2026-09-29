import { useState } from "react";
import { Cpu, Server, Activity, Database, CheckCircle2, RefreshCw } from "lucide-react";

interface AuditEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  domain: string;
  status: "Success" | "Flagged";
}

const AUDIT_LOGS: AuditEntry[] = [
  { id: "LOG-901", time: "13:28:10", user: "Dr. Maria Santos", action: "Executed Response Playbook PB-DENGUE-01", domain: "Playbooks", status: "Success" },
  { id: "LOG-900", time: "13:15:02", user: "Automated Ingestion Cron", action: "Pulled 42 records from EDCS-IS Stream", domain: "Surveillance", status: "Success" },
  { id: "LOG-899", time: "12:45:22", user: "Dr. Andres Ramos", action: "Exported Weekly WESR Surveillance PDF", domain: "Reports", status: "Success" },
  { id: "LOG-898", time: "12:00:00", user: "System Neural Forecaster", action: "Bi-LSTM 14-day projection calculated", domain: "Forecast", status: "Success" },
  { id: "LOG-897", time: "11:32:15", user: "Elena Valenzuela, RN", action: "Acknowledged Alert #104 (Dengue Spike)", domain: "Alerts", status: "Success" },
  { id: "LOG-896", time: "10:14:50", user: "Dr. Maria Santos", action: "Authorized new user account USR-005", domain: "Users", status: "Success" },
];

export function System() {
  const [reindexing, setReindexing] = useState(false);
  const [reindexed, setReindexed] = useState(false);

  function handleReindex() {
    setReindexing(true);
    setTimeout(() => {
      setReindexing(false);
      setReindexed(true);
      setTimeout(() => setReindexed(false), 3000);
    }, 1500);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <Cpu size={13} strokeWidth={2.2} />
              Health Surveillance Infrastructure Telemetry
            </span>
          </div>
          <h1>System Telemetry & Audit Logs</h1>
          <p className="sub">
            Real-time status of EDCS-IS background pipelines, SignalR WebSocket telemetry, and RA 10173 immutable audit logs.
          </p>
        </div>

        <div className="dash-actions">
          <button className="btn-pill" onClick={handleReindex} disabled={reindexing}>
            <RefreshCw size={14} strokeWidth={2.2} className={reindexing ? "spin-in" : ""} />
            <span>{reindexing ? "Flushing Cache..." : "Sync & Flush Diagnostics"}</span>
          </button>
        </div>
      </div>

      {reindexed && (
        <div
          className="card anim"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--green-bg)",
            borderColor: "var(--green-border)",
            color: "var(--green)",
            padding: "12px 18px",
          }}
        >
          <CheckCircle2 size={18} strokeWidth={2.2} />
          <span style={{ fontWeight: 600, fontSize: "13.5px" }}>
            Diagnostic cache flushed. All 4 background service nodes verified operational.
          </span>
        </div>
      )}

      {/* System Health Nodes */}
      <div className="stats">
        <div className="stat card--lift">
          <div className="lbl">
            <span>EDCS-IS Sync Engine</span>
            <CheckCircle2 size={18} strokeWidth={2.2} style={{ color: "var(--green)" }} />
          </div>
          <p className="num tabular" style={{ color: "var(--green)", fontSize: "30px" }}>Healthy</p>
          <div className="trend">
            <span>Every 15 minutes · Zero drop</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>SignalR WebSocket</span>
            <Activity size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          </div>
          <p className="num tabular" style={{ fontSize: "30px" }}>Connected</p>
          <div className="trend">
            <span>8 Active sentinel nodes</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>SQL Server Database</span>
            <Database size={18} strokeWidth={2.2} style={{ color: "var(--green)" }} />
          </div>
          <p className="num tabular" style={{ fontSize: "30px" }}>12<span style={{ fontSize: 18 }}>ms</span></p>
          <div className="trend">
            <span>LocalDB SQLEXPRESS</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Neural Forecaster Cron</span>
            <Server size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          </div>
          <p className="num tabular" style={{ fontSize: "30px" }}>Active</p>
          <div className="trend">
            <span>Next run in 2h 45m</span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Immutable Security & Operations Audit Trail</h3>
            <p className="sub">Cryptographically stamped user actions and automated service dispatches.</p>
          </div>
          <span className="pill pill--ok">Audit Trail Enforced</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log Hash</th>
                <th>Time (UTC+8)</th>
                <th>Initiator</th>
                <th>Domain</th>
                <th>Operation Executed</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {AUDIT_LOGS.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="kbd" style={{ fontSize: "11px" }}>{log.id}</span>
                  </td>
                  <td style={{ color: "var(--mute)" }}>{log.time}</td>
                  <td>
                    <b>{log.user}</b>
                  </td>
                  <td>
                    <span className="pill pill--primary" style={{ fontSize: "11px" }}>
                      {log.domain}
                    </span>
                  </td>
                  <td style={{ color: "var(--ink-secondary)" }}>{log.action}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className="pill pill--ok" style={{ fontSize: "11.5px" }}>
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
