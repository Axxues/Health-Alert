import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { menuItems } from "@/constants/layout/menu/menu";
import { clearSession, getRole, hasPermission } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

function Profile() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="profilebtn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <span className="avatar" aria-hidden>HA</span>
        <span className="profilemeta"><b>Field team</b><small>{getRole() || "Health worker"}</small></span>
        <span aria-hidden style={{ color: "var(--mute)" }}>▾</span>
      </button>
      {open && (
        <div className="card profilemenu anim" role="menu" style={{ "--i": 0 } as React.CSSProperties}>
          <button
            role="menuitem"
            onClick={() => { clearSession(); navigate("/login"); }}
          >
            ⏻&nbsp;&nbsp;Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const links = menuItems.filter((m) => !m.permission || hasPermission(m.permission));
  const close = () => setDrawer(false);

  return (
    <div className="app">
      <header className="topbar">
        <button className="iconbtn drawerbtn" onClick={() => setDrawer(true)} aria-label="Open navigation">☰</button>
        <Link to="/" className="brandlink">
          <img src="/Health-Nology_StartupLogo_PSC11_2.png" alt="Health Alert logo" /> Health Alert
        </Link>
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
          <Profile />
        </div>
      </header>

      <div className="below">
        {drawer && <div className="overlay" onClick={close} />}
        <Sidebar items={links} />
        {drawer && (
          <div className="drawer anim">
            <Sidebar items={links} onNavigate={close} />
          </div>
        )}
        <main className="mainscroll">
          <div className="page" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
