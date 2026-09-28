import { Link } from "react-router";

export function Unauthorized() {
  return (
    <div className="hero-mesh" style={{ minHeight: "100vh", padding: "96px 24px" }}>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 className="display" style={{ fontSize: 32, margin: "0 0 8px" }}>No access</h1>
        <p className="muted" style={{ margin: "0 0 24px" }}>Your role does not include this section. Ask an admin if you need it.</p>
        <Link to="/">Back to dashboard</Link>
      </div>
    </div>
  );
}
