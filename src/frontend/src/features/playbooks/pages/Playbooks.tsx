import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Workflow, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { executePlaybook, listPlaybooks } from "@/services/playbook/api";
import type { Playbook } from "@/services/playbook/types";
import { PlaybookTable } from "../components/PlaybookTable";

export function Playbooks() {
  const [items, setItems] = useState<Playbook[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listPlaybooks()
      .then(setItems)
      .catch(() => setError("Unable to load response playbooks catalog."));
  }, []);

  async function onExecute(id: number) {
    setNote("");
    setError("");
    try {
      const r = await executePlaybook(id);
      setNote(`Playbook deployed successfully: ${r.log || r.status}. Alerts and field checklists updated.`);
    } catch {
      setError("Playbook execution failed. Please verify user authorization.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <Workflow size={13} strokeWidth={2.2} />
              Pre-approved Response Protocols
            </span>
          </div>
          <h1>Outbreak Containment Playbooks</h1>
          <p className="sub">
            Standard operating procedures for rapid field containment, therapeutics prepositioning, and risk communication.
          </p>
        </div>
      </div>

      {note && (
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--green-bg)",
            borderColor: "var(--green-border)",
            color: "var(--green)",
            padding: "14px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={18} strokeWidth={2.2} />
            <span style={{ fontWeight: 600, fontSize: "13.5px" }}>{note}</span>
          </div>
          <Link
            to="/alerts"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--green)",
            }}
          >
            <span>Review generated alerts</span>
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--red-bg)",
            borderColor: "var(--red-border)",
            color: "var(--red)",
            padding: "14px 18px",
          }}
        >
          <AlertCircle size={18} strokeWidth={2.2} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Playbook List */}
      <PlaybookTable items={items} onExecute={onExecute} />
    </div>
  );
}
