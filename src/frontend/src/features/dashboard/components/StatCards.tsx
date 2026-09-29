import { useEffect, useState } from "react";
import { AlertTriangle, Activity, ShieldCheck, TrendingUp, ArrowUpRight } from "lucide-react";

export interface Stat {
  label: string;
  value: number;
  note: string;
  hero?: boolean;
}

function useCountUp(target: number, ms = 800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

const cardConfigs = [
  { borderClass: "border-l-primary", iconBg: "hsl(var(--primary-raw) / 0.1)", iconColor: "var(--primary)", icon: <Activity size={18} strokeWidth={2.2} /> },
  { borderClass: "border-l-destructive", iconBg: "hsl(var(--destructive-raw) / 0.1)", iconColor: "var(--red)", icon: <AlertTriangle size={18} strokeWidth={2.2} /> },
  { borderClass: "border-l-warning", iconBg: "hsl(var(--warning-raw) / 0.1)", iconColor: "var(--amber)", icon: <TrendingUp size={18} strokeWidth={2.2} /> },
  { borderClass: "border-l-success", iconBg: "hsl(var(--success-raw) / 0.1)", iconColor: "var(--green)", icon: <ShieldCheck size={18} strokeWidth={2.2} /> },
];

function StatCard({ s, i }: { s: Stat; i: number }) {
  const n = useCountUp(s.value);
  const cfg = cardConfigs[i % cardConfigs.length];

  return (
    <div
      className={`card stat-card ${cfg.borderClass}`}
      style={{
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--mute)",
              display: "block",
            }}
          >
            {s.label}
          </span>
          <div className="tabular" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", marginTop: 4, lineHeight: 1.1 }}>
            {n.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: cfg.iconBg,
            color: cfg.iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {cfg.icon}
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "var(--mute)", marginTop: 12, display: "flex", alignItems: "center", gap: 5 }}>
        <ArrowUpRight size={13} style={{ color: cfg.iconColor }} />
        <span>{s.note}</span>
      </div>
    </div>
  );
}

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {stats.map((s, i) => (
        <StatCard key={s.label} s={s} i={i} />
      ))}
    </div>
  );
}
