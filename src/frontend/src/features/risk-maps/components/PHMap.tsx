import { PH_PATHS, project } from "./phOutline";
import type { Hotspot } from "@/services/riskmaps/types";

// ponytail: coarse country outline (world.geo.json via glynnbird/countriesgeojson),
// no tile lib for one country silhouette; markers carry the data
function color(level: string) {
  if (/high/i.test(level)) return "var(--red)";
  if (/med|moderate/i.test(level)) return "var(--amber)";
  return "var(--pine)";
}

export function PHMap({ spots }: { spots: Hotspot[] }) {
  return (
    <div className="phmap">
      <svg viewBox="0 0 360 600" role="img" aria-label="Map of the Philippines with outbreak markers">
        {PH_PATHS.map((d, i) => (
          <path key={i} d={d} className="phmap-land" />
        ))}
        {spots.map((s) => {
          const [x, y] = project(s.lng, s.lat);
          const hot = /high/i.test(s.level);
          return (
            <g key={`${s.muni}-${s.disease}`} className="marker" tabIndex={0} aria-label={`${s.muni}, ${s.disease}, ${s.level} risk`}>
              {hot && <circle cx={x} cy={y} r="13" className="halo" style={{ color: color(s.level) }} />}
              <circle cx={x} cy={y} r="6.5" fill={color(s.level)} stroke="var(--card)" strokeWidth="2" />
              <text x={x} y={y - 12} textAnchor="middle" className="marker-lbl">{s.muni}</text>
              <title>{`${s.muni} · ${s.disease} · ${s.level} risk`}</title>
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span><i style={{ background: "var(--red)" }} />High</span>
        <span><i style={{ background: "var(--amber)" }} />Watch</span>
        <span><i style={{ background: "var(--pine)" }} />Routine</span>
      </div>
      <p className="sub" style={{ marginTop: 8 }}>Outline: Natural Earth via world.geo.json, simplified.</p>
    </div>
  );
}
