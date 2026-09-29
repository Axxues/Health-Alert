import { Bug, Waves, Thermometer, Wind, Sparkles } from "lucide-react";

export const DISEASES = [
  { id: "dengue", label: "Dengue Fever", icon: Bug },
  { id: "leptospirosis", label: "Leptospirosis", icon: Waves },
  { id: "ili", label: "Influenza-like Illness", icon: Thermometer },
  { id: "asthma", label: "Asthma & Air Quality", icon: Wind },
] as const;

export function ForecastToolbar({
  disease,
  onChange,
  onRun,
  loading = false,
}: {
  disease: string;
  onChange: (d: string) => void;
  onRun: () => void;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        padding: "8px 12px",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="tab-list" style={{ margin: 0, padding: 0, border: 0 }}>
        {DISEASES.map((item) => {
          const Icon = item.icon;
          const active = disease === item.id;
          return (
            <button
              key={item.id}
              className={`tab-btn ${active ? "active" : ""}`}
              onClick={() => onChange(item.id)}
              type="button"
            >
              <Icon size={16} strokeWidth={2.2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        className="btn-pill"
        onClick={onRun}
        disabled={loading}
        style={{ minHeight: 38, padding: "8px 16px" }}
      >
        <Sparkles size={15} strokeWidth={2.2} />
        <span>{loading ? "Computing Simulation..." : "Simulate Forecast Model"}</span>
      </button>
    </div>
  );
}
