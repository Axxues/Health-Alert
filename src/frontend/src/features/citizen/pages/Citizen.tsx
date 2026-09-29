import { useState } from "react";
import { Send, AlertCircle, ShieldAlert, HeartHandshake, Info } from "lucide-react";
import { askCitizen } from "@/services/citizen/api";
import { ReplyCard } from "../components/ReplyCard";

const COMMON_SYMPTOMS = [
  "May lagnat ako at masakit ang ulo ng 2 araw na (Fever/Headache)",
  "Bumabad ako sa baha kamakailan (Waded in floodwater)",
  "May ubo, sipon, at hirap huminga (Cough & Dyspnea)",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <HeartHandshake size={13} strokeWidth={2.2} />
              Public Health Triage & Citizen Portal
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Kumusta? Anong nararamdaman mo?
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Ipaalam ang inyong mga sintomas para sa agarang gabay medikal at paunang lunas mula sa LGU Health Office.
          </p>
        </div>
      </div>

      {/* Common Symptom Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
          Piliin ang sintomas:
        </span>
        {COMMON_SYMPTOMS.map((sym, i) => (
          <button
            key={i}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors shadow-xs"
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
      <form onSubmit={onAsk} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          placeholder="Ilarawan ang sintomas (hal. Nilalagnat po ako mula kahapon at masakit ang kalamnan)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
          type="submit"
          disabled={loading || !q.trim()}
        >
          <Send size={14} strokeWidth={2.2} />
          <span>{loading ? "Sinusuri..." : "Magtanong"}</span>
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle size={16} strokeWidth={2.2} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ReplyCard reply={reply} />

      {/* Public Advisory Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Dengue Card */}
        <div className="rounded-xl border border-border border-l-4 border-l-blue-500 bg-card p-5 shadow-sm space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Info size={15} strokeWidth={2.2} />
            DOH 4S Kontra Dengue
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Search & destroy mosquito breeding sites; Self-protection; Seek early consultation; Say yes to fogging in outbreak hotspots.
          </p>
        </div>

        {/* Leptospirosis Card */}
        <div className="rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-5 shadow-sm space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ShieldAlert size={15} strokeWidth={2.2} />
            Baha at Leptospirosis
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kung nalubog sa tubig-baha, uminom ng Doxycycline prophylaxis sa loob ng 24-48 oras ayon sa payo ng health center.
          </p>
        </div>

        {/* Free Medicine Card */}
        <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 bg-card p-5 shadow-sm space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <HeartHandshake size={15} strokeWidth={2.2} />
            Libreng Gamot at Reseta
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            May nakahandang ORS, paracetamol, at antibiotics sa Rural Health Unit (RHU) para sa lahat ng kwalipikadong residente.
          </p>
        </div>
      </div>
    </div>
  );
}
