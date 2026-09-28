import { useRef, useState } from "react";
import { PH_PATHS, project } from "./phOutline";
import type { Hotspot } from "@/services/riskmaps/types";

// ponytail: hand-rolled viewBox pan/zoom, no tile lib for one country silhouette
const HOME = { x: 0, y: 0, w: 360, h: 600 };
const MIN_W = 50;

function color(level: string) {
  if (/high/i.test(level)) return "var(--red)";
  if (/med|moderate/i.test(level)) return "var(--amber)";
  return "var(--pine)";
}

export function PHMap({ spots, selected, onSelect }: {
  spots: Hotspot[];
  selected: Hotspot | null;
  onSelect: (s: Hotspot | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const [vb, setVb] = useState(HOME);
  const [drag, setDrag] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  function toSvg(e: { clientX: number; clientY: number }) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: vb.x + ((e.clientX - r.left) / r.width) * vb.w, y: vb.y + ((e.clientY - r.top) / r.height) * vb.h };
  }

  function pick(s: Hotspot, isSel: boolean, e: { clientX: number; clientY: number }) {
    const d = downRef.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return; // it was a drag, not a tap
    onSelect(isSel ? null : s);
  }

  function clamp(v: typeof HOME) {
    const w = Math.min(HOME.w, Math.max(MIN_W, v.w));
    const h = (w / HOME.w) * HOME.h;
    return { w, h, x: Math.min(HOME.x + HOME.w - w, Math.max(HOME.x, v.x)), y: Math.min(HOME.y + HOME.h - h, Math.max(HOME.y, v.y)) };
  }

  function zoom(f: number, c?: { x: number; y: number }) {
    setVb((v) => {
      const w = Math.min(HOME.w, Math.max(MIN_W, v.w * f));
      const s = w / v.w;
      const cx = c ?? { x: v.x + v.w / 2, y: v.y + v.h / 2 };
      const h = (w / HOME.w) * HOME.h;
      return clamp({ w, h, x: cx.x - (cx.x - v.x) * s, y: cx.y - (cx.y - v.y) * s });
    });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoom(e.deltaY > 0 ? 1.2 : 1 / 1.2, toSvg(e));
  }

  const zoomed = vb.w < HOME.w - 1;

  return (
    <div className="phmap">
      <div className="phmap-tools" role="toolbar" aria-label="Map controls">
        <button className="iconbtn" onClick={() => zoom(1 / 1.4)} aria-label="Zoom in">+</button>
        <button className="iconbtn" onClick={() => zoom(1.4)} aria-label="Zoom out">−</button>
        <button className="iconbtn" onClick={() => setVb(HOME)} disabled={!zoomed} aria-label="Reset view">↺</button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        role="img" aria-label="Map of the Philippines with outbreak markers. Scroll to zoom, drag to move."
        onWheel={onWheel}
        onPointerDown={(e) => { downRef.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); const p = toSvg(e); setDrag({ sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y }); }}
        onPointerMove={(e) => {
          if (!drag) return;
          const r = svgRef.current!.getBoundingClientRect();
          const px = ((e.clientX - drag.sx) / r.width) * vb.w;
          const py = ((e.clientY - drag.sy) / r.height) * vb.h;
          setVb((v) => clamp({ ...v, x: drag.ox - px, y: drag.oy - py }));
        }}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        {PH_PATHS.map((d, i) => (
          <path key={i} d={d} className="phmap-land" />
        ))}
        {spots.map((s) => {
          const [x, y] = project(s.lng, s.lat);
          const hot = /high/i.test(s.level);
          const isSel = selected?.muni === s.muni && selected?.disease === s.disease;
          return (
            <g
              key={`${s.muni}-${s.disease}`} className={`marker${isSel ? " marker--sel" : ""}`}
              tabIndex={0} aria-label={`${s.muni}, ${s.disease}, ${s.level} risk`}
              onClick={(e) => { e.stopPropagation(); pick(s, isSel, e); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(isSel ? null : s); } }}
            >
              {hot && <circle cx={x} cy={y} r="13" className="halo" style={{ color: color(s.level) }} />}
              {isSel && <circle cx={x} cy={y} r="12" fill="none" stroke="var(--pine)" strokeWidth="2.5" />}
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
