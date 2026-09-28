import { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "@/services/auth/api";
import { setSession } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await authApi.login({ username, password });
      setSession(data.token, data.role, data.permissions ?? []);
      navigate("/");
    } catch {
      setError("Could not sign in. Check your details and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="panel">
        <div className="brand anim" style={{ padding: 0, color: "#fff", "--i": 0 } as React.CSSProperties}>
          <span className="mark" style={{ borderColor: "#fff", color: "#fff" }}>◉</span> Health Alert
        </div>
        <div style={{ marginTop: "12vh" }}>
          <h1 className="anim" style={{ "--i": 1 } as React.CSSProperties}>Today's outlook, before the clinic opens.</h1>
          <div className="rule anim" style={{ "--i": 2 } as React.CSSProperties} />
          <p className="anim" style={{ "--i": 3 } as React.CSSProperties}>
            Hotspots, forecasts, and playbooks for your municipality — on one screen, no encoding, no waiting.
          </p>
        </div>
        <p className="foot">Offline-first · No personal data · Built for RHUs and LGUs</p>
      </div>
      <div className="formwrap">
        <span className="toggle"><ThemeToggle /></span>
        <form className="card anim" onSubmit={onSubmit} style={{ "--i": 2 } as React.CSSProperties}>
          <h2 style={{ fontSize: 26, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Welcome back</h2>
          <p className="sub" style={{ margin: "0 0 22px" }}>Sign in to see today's health outlook.</p>
          <div style={{ display: "grid", gap: 12 }}>
            <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <p key={error} className="err">{error}</p>}
            <button className="btn-pill btn-sheen" type="submit" disabled={busy} style={{ justifyContent: "center" }}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
