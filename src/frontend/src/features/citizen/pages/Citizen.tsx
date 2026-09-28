import { useState } from "react";
import { askCitizen } from "@/services/citizen/api";
import { ReplyCard } from "../components/ReplyCard";

export function Citizen() {
  const [q, setQ] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const r = await askCitizen(q);
      setReply(r.reply);
    } catch {
      setError("Hindi makakonek. Subukan ulit.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0, maxWidth: "24ch" }}>Kumusta? Anong nararamdaman mo?</h1>
      <form onSubmit={onAsk} style={{ display: "flex", gap: 8 }}>
        <input className="input" style={{ flex: 1 }} placeholder="May lagnat ako ng 2 araw…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-pill" type="submit">Magtanong</button>
      </form>
      {error ? <p style={{ color: "var(--red)", margin: 0 }}>{error}</p> : <ReplyCard reply={reply} />}
    </div>
  );
}
