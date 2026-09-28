import { useEffect, useState } from "react";
import { Link } from "react-router";
import { executePlaybook, listPlaybooks } from "@/services/playbook/api";
import type { Playbook } from "@/services/playbook/types";
import { PlaybookTable } from "../components/PlaybookTable";

export function Playbooks() {
  const [items, setItems] = useState<Playbook[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listPlaybooks().then(setItems).catch(() => setError("Could not load playbooks. Try again."));
  }, []);

  async function onExecute(id: number) {
    setNote("");
    try {
      const r = await executePlaybook(id);
      setNote(`Done: ${r.log || r.status}. Alerts were updated.`);
    } catch {
      setError("Run failed. Try again.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>What to do next</h1>
      <div className="card">
        {error ? <p style={{ color: "var(--red)", margin: 0 }}>{error}</p> : <PlaybookTable items={items} onExecute={onExecute} />}
        {note && <p style={{ margin: "12px 0 0" }}>{note} <Link to="/alerts">Check alerts →</Link></p>}
      </div>
    </div>
  );
}
