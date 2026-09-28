import { useNavigate } from "react-router";
import { clearSession } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Navbar() {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <label className="search">
        <span aria-hidden>⌕</span>
        <input placeholder="Search hotspots, places, diseases" aria-label="Search" />
        <span className="muted" style={{ fontSize: 12 }}>⌘F</span>
      </label>
      <div className="who">
        <ThemeToggle />
        <button className="iconbtn" aria-label="Messages">✉</button>
        <button className="iconbtn" aria-label="Notifications">
          ♪<span className="dot dot--pulse" style={{ position: "absolute", marginLeft: 18, marginTop: -16, color: "var(--red)" }} />
        </button>
        <span className="avatar" aria-hidden>HA</span>
        <button
          className="btn-pill btn-pill--ghost"
          onClick={() => { clearSession(); navigate("/login"); }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
