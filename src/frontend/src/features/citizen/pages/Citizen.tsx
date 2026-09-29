import { useState } from "react";
import { Send, AlertCircle, ShieldAlert, HeartHandshake, Info } from "lucide-react";
import { askCitizen } from "@/services/citizen/api";
import { ReplyCard } from "../components/ReplyCard";

const COMMON_SYMPTOMS = [
  "May lagnat ako at masakit ang ulo ng 2 araw na (Fever/Headache)",
  "Bumabad ako sa baha kamakailan (Waded in floodwater)",
  "May ubo, sipon, at hirap huminga (Cough & Breathing difficulty)",
  "Pabalik-balik ang pagsusuka at pagkahilo (Vomiting & Dizziness)",
];

export function Citizen() {
  const [q, setQ] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(queryText: string) {
    if (!queryText.trim()) return;
    setError("");
    setLoading(true);
    try {
      const r = await askCitizen(queryText);
      setReply(r.reply);
    } catch {
      setError("Hindi makakonek sa surveillance service. Pakisubukan muli.");
    } finally {
      setLoading(false);
    }
  }

  function onAsk(e: React.FormEvent) {
    e.preventDefault();
    void handleAsk(q);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <HeartHandshake size={13} strokeWidth={2.2} />
              Public Health Triage & Citizen Portal
            </span>
          </div>
          <h1>Kumusta? Anong nararamdaman mo?</h1>
          <p className="sub">
            Ipaalam ang inyong mga sintomas para sa agarang gabay medikal at paunang lunas mula sa LGU Health Office.
          </p>
        </div>
      </div>

      {/* Common Symptom Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--mute)", textTransform: "uppercase" }}>
          Piliin ang nararamdaman:
        </span>
        {COMMON_SYMPTOMS.map((sym, i) => (
          <button
            key={i}
            className="tab-btn"
            style={{ fontSize: "12px", padding: "6px 12px", background: "var(--card)" }}
            onClick={() => {
              setQ(sym);
              void handleAsk(sym);
            }}
            type="button"
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={onAsk} style={{ display: "flex", gap: 10 }}>
        <input
          className="input"
          style={{ flex: 1, padding: "12px 18px", fontSize: "14px" }}
          placeholder="Ilarawan ang sintomas (hal. Nilalagnat po ako mula kahapon at masakit ang kalamnan)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="btn-pill"
          type="submit"
          disabled={loading || !q.trim()}
          style={{ minHeight: 46, padding: "0 22px" }}
        >
          <Send size={15} strokeWidth={2.2} />
          <span>{loading ? "Sinusuri..." : "Magtanong (Triage)"}</span>
        </button>
      </form>

      {error && (
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
      )}

      <ReplyCard reply={reply} />

      {/* Public Advisory Information Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 10 }}>
        <div className="card">
          <h4 style={{ margin: "0 0 6px", fontSize: "14px", display: "flex", alignItems: "center", gap: 6, color: "var(--primary)" }}>
            <Info size={16} strokeWidth={2.2} />
            DOH 4S Kontra Dengue
          </h4>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--mute)", lineHeight: 1.5 }}>
            Search & destroy mosquito breeding sites; Self-protection; Seek early consultation; Say yes to fogging in outbreak hotspots.
          </p>
        </div>

        <div className="card">
          <h4 style={{ margin: "0 0 6px", fontSize: "14px", display: "flex", alignItems: "center", gap: 6, color: "var(--amber)" }}>
            <ShieldAlert size={16} strokeWidth={2.2} />
            Baha at Leptospirosis
          </h4>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--mute)", lineHeight: 1.5 }}>
            Kung nalubog sa tubig-baha, uminom ng Doxycycline prophylaxis sa loob ng 24-48 oras ayon sa payo ng health center.
          </p>
        </div>

        <div className="card">
          <h4 style={{ margin: "0 0 6px", fontSize: "14px", display: "flex", alignItems: "center", gap: 6, color: "var(--green)" }}>
            <HeartHandshake size={16} strokeWidth={2.2} />
            Libreng Gamot at Reseta
          </h4>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--mute)", lineHeight: 1.5 }}>
            May nakahandang ORS, paracetamol, at antibiotics sa Rural Health Unit (RHU) para sa lahat ng residente.
          </p>
        </div>
      </div>
    </div>
  );
}
