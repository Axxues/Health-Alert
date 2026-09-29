import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { PH_PATHS, project } from "./phOutline";
import type { Hotspot } from "@/services/riskmaps/types";

const HOME = { x: 0, y: 0, w: 360, h: 600 };
const MIN_W = 50;

function color(level: string) {
  if (/high/i.test(level)) return "var(--red)";
  if (/med|moderate/i.test(level)) return "var(--amber)";
  return "var(--primary)";
}

export function PHMap({
  spots,
  selected,
  onSelect,
}: {
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
    return {
      x: vb.x + ((e.clientX - r.left) / r.width) * vb.w,
      y: vb.y + ((e.clientY - r.top) / r.height) * vb.h,
    };
  }

  function pick(s: Hotspot, isSel: boolean, e: { clientX: number; clientY: number }) {
    const d = downRef.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
    onSelect(isSel ? null : s);
  }

  function clamp(v: typeof HOME) {
    const w = Math.min(HOME.w, Math.max(MIN_W, v.w));
    const h = (w / HOME.w) * HOME.h;
    return {
      w,
      h,
      x: Math.min(HOME.x + HOME.w - w, Math.max(HOME.x, v.x)),
      y: Math.min(HOME.y + HOME.h - h, Math.max(HOME.y, v.y)),
    };
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
      <div className="phmap-tools" role="toolbar" aria-label="Map navigation tools">
        <button
          className="iconbtn"
          onClick={() => zoom(1 / 1.4)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn size={16} strokeWidth={2.2} />
        </button>
        <button
          className="iconbtn"
          onClick={() => zoom(1.4)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut size={16} strokeWidth={2.2} />
        </button>
        <button
          className="iconbtn"
          onClick={() => setVb(HOME)}
          disabled={!zoomed}
          aria-label="Reset map extent"
          title="Reset map extent"
        >
          <RotateCcw size={16} strokeWidth={2.2} />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        role="img"
        aria-label="Geospatial outbreak map of the Philippines with active surveillance hotspots"
        onWheel={onWheel}
        onPointerDown={(e) => {
          downRef.current = { x: e.clientX, y: e.clientY };
          (e.target as Element).setPointerCapture?.(e.pointerId);
          const p = toSvg(e);
          setDrag({ sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y });
        }}
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
          const c = color(s.level);

          return (
            <g
              key={`${s.muni}-${s.disease}`}
              className={`marker${isSel ? " marker--sel" : ""}`}
              tabIndex={0}
              aria-label={`${s.muni}, ${s.disease}, ${s.level} risk`}
              onClick={(e) => {
                e.stopPropagation();
                pick(s, isSel, e);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(isSel ? null : s);
                }
              }}
            >
              {hot && <circle cx={x} cy={y} r="14" className="halo" style={{ color: c }} />}
              {isSel && <circle cx={x} cy={y} r="13" fill="none" stroke="var(--primary)" strokeWidth="3" />}
              <circle cx={x} cy={y} r="6.5" fill={c} stroke="var(--card)" strokeWidth="2.5" />
              <text x={x} y={y - 12} textAnchor="middle" className="marker-lbl">
                {s.muni}
              </text>
              <title>{`${s.muni} · ${s.disease} · ${s.level} risk tier`}</title>
            </g>
          );
        })}
      </svg>

      <div className="legend" style={{ marginTop: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <i style={{ background: "var(--red)" }} />
          <span>High Outbreak Surge</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <i style={{ background: "var(--amber)" }} />
          <span>Elevated Watch</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <i style={{ background: "var(--primary)" }} />
          <span>Routine Sentinel</span>
        </span>
      </div>
    </div>
  );
}
