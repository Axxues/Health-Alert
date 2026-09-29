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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <Cpu size={13} strokeWidth={2.2} />
              Health Surveillance Infrastructure Telemetry
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            System Telemetry & Audit Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time status of EDCS-IS background pipelines, SignalR WebSocket telemetry, and RA 10173 immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} strokeWidth={2.2} className={reindexing ? "animate-spin" : ""} />
            <span>{reindexing ? "Flushing Cache..." : "Sync & Flush Diagnostics"}</span>
          </button>
        </div>
      </div>

      {reindexed && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle2 size={16} strokeWidth={2.2} className="shrink-0" />
          <span>Diagnostic cache flushed. All 4 background service nodes verified operational.</span>
        </div>
      )}

      {/* System Health Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* EDCS-IS Sync Engine */}
        <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>EDCS-IS Sync Engine</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} strokeWidth={2.2} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            Healthy
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            Every 15 minutes · Zero drop
          </div>
        </div>

        {/* SignalR WebSocket */}
        <div className="rounded-xl border border-border border-l-4 border-l-blue-500 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>SignalR WebSocket</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity size={16} strokeWidth={2.2} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Connected
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            8 Active sentinel nodes
          </div>
        </div>

        {/* SQL Server Database */}
        <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>SQL Server Database</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database size={16} strokeWidth={2.2} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            12<span className="text-base font-normal text-muted-foreground"> ms</span>
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            LocalDB SQLEXPRESS
          </div>
        </div>

        {/* Neural Forecaster Cron */}
        <div className="rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Neural Forecaster Cron</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Server size={16} strokeWidth={2.2} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Active
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            Next run in 2h 45m
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Immutable Security & Operations Audit Trail
            </h3>
            <p className="text-xs text-muted-foreground">
              Cryptographically stamped user actions and automated service dispatches.
            </p>
          </div>
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Audit Trail Enforced
          </span>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Log Hash</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Time (UTC+8)</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Initiator</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Operation Executed</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                        {log.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px]">
                      {log.time}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-foreground">
                      {log.user}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        {log.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-muted-foreground">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} strokeWidth={2.2} />
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
    </div>
  );
}
