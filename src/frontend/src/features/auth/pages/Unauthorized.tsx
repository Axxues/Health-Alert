import { useRef, useState } from "react";
import { Link } from "react-router";

const MAX = 13;

export function Unauthorized() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState("perspective(900px)");
  const [g, setG] = useState({ x: "50%", y: "50%" });

  function onMove(e: React.PointerEvent) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setT(`perspective(900px) rotateX(${(-y * MAX).toFixed(2)}deg) rotateY(${(x * MAX).toFixed(2)}deg) translate(${(x * 14).toFixed(1)}px, ${(y * 14 - 4).toFixed(1)}px)`);
    setG({ x: `${Math.round((x + 0.5) * 100)}%`, y: `${Math.round((y + 0.5) * 100)}%` });
  }

  return (
    <div className="stage" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)", padding: 24 }}>
      <span className="blob blob--a" aria-hidden />
      <span className="blob blob--b" aria-hidden />
      <div className="floaty" style={{ position: "relative", zIndex: 1 }}>
        <div
          ref={ref}
          className="card anim tilt glare"
          onPointerMove={onMove}
          onPointerLeave={() => setT("perspective(900px)")}
          style={{ maxWidth: 440, textAlign: "center", padding: "40px 36px", transform: t, "--mx": g.x, "--my": g.y } as React.CSSProperties}
        >
          <span className="avatar anim mark-spin" aria-hidden style={{ width: 52, height: 52, fontSize: 20, "--i": 1 } as React.CSSProperties}>◉</span>
          <h1 className="anim" style={{ fontSize: 26, margin: "16px 0 8px", letterSpacing: "-0.02em", "--i": 2 } as React.CSSProperties}>No access</h1>
          <p className="sub anim" style={{ margin: "0 0 24px", lineHeight: 1.55, "--i": 3 } as React.CSSProperties}>
            Your role doesn't include this section. Ask an admin if you need it,
            or head back to today's overview.
          </p>
          <Link className="btn-pill btn-sheen anim" to="/" style={{ textDecoration: "none", justifyContent: "center", width: "100%", "--i": 4 } as React.CSSProperties}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
