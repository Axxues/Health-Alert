import { useEffect, useState } from "react";
import { BellRing, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { ackAlert, listAlerts } from "@/services/alerts/api";
import type { HealthAlert } from "@/services/alerts/types";
import { AlertTable } from "../components/AlertTable";

export function Alerts() {
  const [items, setItems] = useState<HealthAlert[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "acked">("all");
  const [error, setError] = useState("");

  useEffect(() => {
    listAlerts()
      .then(setItems)
      .catch(() => setError("Unable to load incident alerts. Check network connection."));
  }, []);

  async function onAck(id: number) {
    try {
      const updated = await ackAlert(id);
      if (updated) {
        setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
      } else {
        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: "acked" } : a)));
      }
    } catch {
      setError("Failed to acknowledge alert. Please try again.");
    }
  }

  const activeCount = items.filter((a) => a.status !== "acked").length;
  const ackedCount = items.filter((a) => a.status === "acked").length;

  const filteredItems = items.filter((a) => {
    if (filter === "active") return a.status !== "acked";
    if (filter === "acked") return a.status === "acked";
    return true;
  });

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div className="dash-head m-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Automated Triage Stream Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight m-0">Public Health Alert Center</h1>
          <p className="text-xs text-muted-foreground m-0 mt-0.5">
            Real-time threshold breaches, rapid response triggers, and multi-agency containment notifications.
          </p>
        </div>
      </div>

      {/* KPI Cards - Cellwego border-l-4 archetype */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border border-l-4 border-l-destructive rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Pending Alerts</span>
            <div className={`text-2xl font-bold tracking-tight font-mono mt-1 ${activeCount > 0 ? "text-destructive" : "text-foreground"}`}>
              {activeCount}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Require officer action</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <BellRing size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-emerald-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Resolved / Acknowledged</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">{ackedCount}</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Contained or monitored</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total Logged Alerts</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">{items.length}</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Epidemiological period</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldAlert size={20} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-purple-500 rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Mean Response Time</span>
            <div className="text-2xl font-bold tracking-tight text-emerald-500 mt-1 font-mono">&lt; 15m</div>
            <span className="text-xs text-muted-foreground mt-0.5 block">Within SLA standards</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
            <span className="text-xs font-bold font-mono">SLA</span>
          </div>
        </div>
      </div>

      {/* Main Alert Card */}
      <div className="section-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 items-center">
            <button
              className={`btn-pill text-xs px-3 py-1 ${filter === "all" ? "" : "btn-pill--ghost"}`}
              onClick={() => setFilter("all")}
              type="button"
            >
              All Alerts ({items.length})
            </button>
            <button
              className={`btn-pill text-xs px-3 py-1 ${filter === "active" ? "" : "btn-pill--ghost"}`}
              onClick={() => setFilter("active")}
              type="button"
            >
              Action Required ({activeCount})
            </button>
            <button
              className={`btn-pill text-xs px-3 py-1 ${filter === "acked" ? "" : "btn-pill--ghost"}`}
              onClick={() => setFilter("acked")}
              type="button"
            >
              Resolved ({ackedCount})
            </button>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-semibold">
              <AlertCircle size={16} strokeWidth={2} />
              <span>{error}</span>
            </div>
          ) : (
            <AlertTable items={filteredItems} onAck={onAck} />
          )}
        </div>
      </div>
    </div>
  );
}
