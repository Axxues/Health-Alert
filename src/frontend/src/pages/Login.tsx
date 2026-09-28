import { useState } from "react";
import { useNavigate } from "react-router";
import { setSession } from "@/utils/auth";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Sign in failed");
      setSession(json.data.token, json.data.role, json.data.permissions ?? []);
      navigate("/");
    } catch {
      setError("Could not sign in. Check your details and try again.");
    }
  }

  return (
    <div className="hero-mesh" style={{ minHeight: "100vh", padding: "96px 24px" }}>
      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1 className="display" style={{ fontSize: 32, margin: "0 0 8px" }}>Welcome back</h1>
        <p className="muted" style={{ margin: "0 0 24px" }}>Sign in to see today's health outlook.</p>
        <div style={{ display: "grid", gap: 12 }}>
          <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p style={{ color: "var(--ruby)", margin: 0 }}>{error}</p>}
          <button className="btn-pill" type="submit">Sign in</button>
        </div>
      </form>
    </div>
  );
}
