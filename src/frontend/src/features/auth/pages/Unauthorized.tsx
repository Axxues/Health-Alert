import { Link } from "react-router";

export function Unauthorized() {
  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--canvas)", padding: 24,
      }}
    >
      <div className="card anim" style={{ maxWidth: 440, textAlign: "center", padding: "40px 36px" }}>
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
