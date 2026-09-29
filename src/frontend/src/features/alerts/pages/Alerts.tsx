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
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="live-badge">
              <span className="dot dot--pulse" />
              Automated Triage Stream Active
            </span>
          </div>
          <h1>Public Health Alert Center</h1>
          <p className="sub">
            Real-time threshold breaches, rapid response triggers, and multi-agency containment notifications.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats">
        <div className="stat card--lift">
          <div className="lbl">
            <span>Pending Alerts</span>
            <BellRing size={18} strokeWidth={2.2} style={{ color: "var(--red)" }} />
          </div>
          <p className="num tabular" style={{ color: activeCount > 0 ? "var(--red)" : "var(--ink)" }}>
            {activeCount}
          </p>
          <div className="trend">
            <span>Require officer acknowledgment</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Resolved / Acknowledged</span>
            <CheckCircle2 size={18} strokeWidth={2.2} style={{ color: "var(--green)" }} />
          </div>
          <p className="num tabular">{ackedCount}</p>
          <div className="trend">
            <span>Contained or monitored</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Total Logged Alerts</span>
            <ShieldAlert size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          </div>
          <p className="num tabular">{items.length}</p>
          <div className="trend">
            <span>Epidemiological period</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Mean Response Time</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--green)" }}>Optimal</span>
          </div>
          <p className="num tabular">&lt; 15<span style={{ fontSize: 20 }}>m</span></p>
          <div className="trend">
            <span>Within SLA standards</span>
          </div>
        </div>
      </div>

      {/* Main Alert Card */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div className="tab-list" style={{ margin: 0, padding: 0, border: 0 }}>
            <button
              className={`tab-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
              type="button"
            >
              All Alerts ({items.length})
            </button>
            <button
              className={`tab-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
              type="button"
            >
              Action Required ({activeCount})
            </button>
            <button
              className={`tab-btn ${filter === "acked" ? "active" : ""}`}
              onClick={() => setFilter("acked")}
              type="button"
            >
              Resolved ({ackedCount})
            </button>
          </div>
        </div>

        {error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "var(--red-bg)",
              borderRadius: "var(--radius-md)",
              color: "var(--red)",
            }}
          >
            <AlertCircle size={18} strokeWidth={2.2} />
            <span>{error}</span>
          </div>
        ) : (
          <AlertTable items={filteredItems} onAck={onAck} />
        )}
      </div>
    </div>
  );
}
