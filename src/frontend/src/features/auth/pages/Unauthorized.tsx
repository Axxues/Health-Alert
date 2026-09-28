import { useRef, useState } from "react";
import { Link } from "react-router";

const MAX = 7;

export function Unauthorized() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState("perspective(900px)");

  function onMove(e: React.PointerEvent) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setT(`perspective(900px) rotateX(${(-y * MAX).toFixed(2)}deg) rotateY(${(x * MAX).toFixed(2)}deg) translateY(-4px)`);
  }

  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--canvas)", padding: 24,
      }}
    >
      <div
        ref={ref}
        className="card anim tilt"
        onPointerMove={onMove}
        onPointerLeave={() => setT("perspective(900px)")}
        style={{ maxWidth: 440, textAlign: "center", padding: "40px 36px", transform: t }}
      >
        <span className="avatar" aria-hidden style={{ width: 52, height: 52, fontSize: 20 }}>◉</span>
        <h1 style={{ fontSize: 26, margin: "16px 0 8px", letterSpacing: "-0.02em" }}>No access</h1>
        <p className="sub" style={{ margin: "0 0 24px", lineHeight: 1.55 }}>
          Your role doesn't include this section. Ask an admin if you need it,
          or head back to today's overview.
        </p>
        <Link className="btn-pill" to="/" style={{ textDecoration: "none", justifyContent: "center", width: "100%" }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
