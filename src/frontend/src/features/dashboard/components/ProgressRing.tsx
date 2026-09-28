import { useEffect, useState } from "react";

const R = 64;
const C = 2 * Math.PI * R;

export function ProgressRing({ pct, label, legend }: { pct: number; label: string; legend: { color: string; text: string }[] }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="ringwrap">
      <svg className="ring" width="170" height="170" viewBox="0 0 170 170" role="img" aria-label={`${clamped}% ${label}`}>
        <circle className="track" cx="85" cy="85" r={R} fill="none" strokeWidth="18" strokeDasharray={`34 10`} opacity="0.55" />
        <circle
          className="prog"
          cx="85" cy="85" r={R} fill="none" strokeWidth="18"
          strokeDasharray={C}
          strokeDashoffset={on ? C * (1 - clamped / 100) : C}
        />
        <text x="85" y="82" textAnchor="middle" fontSize="30" fontWeight="750" fill="var(--ink)" transform="rotate(90 85 85)">{clamped}%</text>
        <text x="85" y="102" textAnchor="middle" fontSize="12" fill="var(--mute)" transform="rotate(90 85 85)">{label}</text>
      </svg>
      <div className="legend">
        {legend.map((l) => <span key={l.text}><i style={{ background: l.color }} />{l.text}</span>)}
      </div>
    </div>
  );
}
