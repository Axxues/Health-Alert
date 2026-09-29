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
    <div className="grid gap-5">
      {/* Header */}
      <div className="dash-head m-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5">
              <Workflow size={13} strokeWidth={2.2} />
              Pre-approved Response Protocols
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight m-0">Outbreak Containment Playbooks</h1>
          <p className="text-xs text-muted-foreground m-0 mt-0.5">
            Standard operating procedures for rapid field containment, therapeutics prepositioning, and risk communication.
          </p>
        </div>
      </div>

      {note && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} strokeWidth={2.2} />
            <span>{note}</span>
          </div>
          <Link
            to="/alerts"
            className="font-semibold text-emerald-500 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Review generated alerts</span>
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-semibold">
          <AlertCircle size={16} strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      {/* Playbook List */}
      <PlaybookTable items={items} onExecute={onExecute} />
    </div>
  );
}
