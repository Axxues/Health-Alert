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

const icons = [
  <Activity size={18} strokeWidth={2.2} key="0" />,
  <AlertTriangle size={18} strokeWidth={2.2} key="1" />,
  <TrendingUp size={18} strokeWidth={2.2} key="2" />,
  <ShieldCheck size={18} strokeWidth={2.2} key="3" />,
];

function StatCard({ s, i }: { s: Stat; i: number }) {
  const n = useCountUp(s.value);
  return (
    <div
      className={`stat anim${s.hero ? " stat--hero" : ""}`}
      style={{ "--i": i } as React.CSSProperties}
    >
      <div className="lbl">
        <span>{s.label}</span>
        <span style={{ opacity: 0.85 }}>{icons[i % icons.length]}</span>
      </div>
      <p className="num tabular">{n}</p>
      <div className="trend">
        <ArrowUpRight size={14} strokeWidth={2.2} style={{ flex: "none" }} />
        <span>{s.note}</span>
      </div>
    </div>
  );
}

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats">
      {stats.map((s, i) => (
        <StatCard key={s.label} s={s} i={i} />
      ))}
    </div>
  );
}
