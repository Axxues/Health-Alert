import { useEffect, useState } from "react";

export interface Stat { label: string; value: number; note: string; hero?: boolean }

// ponytail: co-located, single use — promote to hooks/ if a second counter appears
function useCountUp(target: number, ms = 900) {
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

function StatCard({ s, i }: { s: Stat; i: number }) {
  const n = useCountUp(s.value);
  return (
    <div className={`stat anim${s.hero ? " stat--hero" : " card--lift"}`} style={{ "--i": i } as React.CSSProperties}>
      <p className="lbl">{s.label} <span className="arrowchip" aria-hidden>↗</span></p>
      <p className="num tabular">{n}</p>
      <p className="trend">{s.note}</p>
    </div>
  );
}

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats">
      {stats.map((s, i) => <StatCard key={s.label} s={s} i={i} />)}
    </div>
  );
}
