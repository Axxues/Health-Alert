import { useEffect, useState } from "react";
import { ackAlert, listAlerts } from "@/services/alerts/api";
import type { HealthAlert } from "@/services/alerts/types";
import { AlertTable } from "../components/AlertTable";

export function Alerts() {
  const [items, setItems] = useState<HealthAlert[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listAlerts().then(setItems).catch(() => setError("Could not load alerts. Try again."));
  }, []);

  async function onAck(id: number) {
    try {
      const updated = await ackAlert(id);
      if (updated) setItems((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      setError("Acknowledge failed. Try again.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Alerts needing you</h1>
      <div className="card">
        {error ? <p style={{ color: "var(--red)", margin: 0 }}>{error}</p> : <AlertTable items={items} onAck={onAck} />}
      </div>
    </div>
  );
}
