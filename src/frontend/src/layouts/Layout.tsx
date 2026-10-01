import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Menu,
  Search,
  LogOut,
  ChevronDown,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpenCheck,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { menuItems } from "@/constants/layout/menu/menu";
import { clearSession, getRole, hasPermission } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GuidelinesPanel } from "@/features/rag/components/GuidelinesPanel";

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

  const role = getRole() || "Surveillance Officer";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="profilebtn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar" aria-hidden="true">
          MS
        </span>
        <span className="profilemeta">
          <b>Dr. M. Santos</b>
          <small>{role}</small>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          style={{
            color: "var(--mute)",
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div className="card profilemenu anim" role="menu" style={{ "--i": 0 } as React.CSSProperties}>
          <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid var(--hairline)", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink)" }}>Dr. Maria Santos</div>
            <div style={{ fontSize: "11.5px", color: "var(--mute)", marginTop: 2 }}>mho.sanfernando@doh.gov.ph</div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              clearSession();
              navigate("/login");
            }}
            style={{ color: "var(--red)" }}
          >
            <LogOut size={14} strokeWidth={2} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideShown, setGuideShown] = useState(false);
  const guideTimer = useRef<number | null>(null);
  const { pathname } = useLocation();
  const links = menuItems.filter(
    (m) => (!m.permission || hasPermission(m.permission)) && (m.path !== "/users" || getRole() === "Admin")
  );
  const close = () => setDrawer(false);

  // ponytail: two-phase open/close so the drawer animates both ways; unmount lags 220ms.
  function openGuide() {
    if (guideTimer.current) window.clearTimeout(guideTimer.current);
    setGuideOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setGuideShown(true)));
  }

  function closeGuide() {
    setGuideShown(false);
    if (guideTimer.current) window.clearTimeout(guideTimer.current);
    guideTimer.current = window.setTimeout(() => setGuideOpen(false), 220);
  }

  useEffect(() => () => {
    if (guideTimer.current) window.clearTimeout(guideTimer.current);
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeGuide();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideOpen]);

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="iconbtn drawerbtn"
          onClick={() => setDrawer(true)}
          aria-label="Open navigation"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <div className="flex items-center gap-2.5">
          <Link to="/" className="brandlink">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "hsl(var(--primary-raw) / 0.12)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid hsl(var(--primary-raw) / 0.25)",
              }}
            >
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <span>HealthAlert</span>
          </Link>
        </div>

        <label className="search">
          <Search size={15} strokeWidth={2.2} style={{ color: "var(--mute)", flex: "none" }} />
          <input
            placeholder="Search hotspots, sentinel nodes, diseases..."
            aria-label="Search"
          />
          <span className="kbd">⌘K</span>
        </label>

        <div className="who">
          <ThemeToggle />

          <Profile />
        </div>
      </header>

      <div className="below">
        {drawer && <div className="overlay" onClick={close} />}

        <div style={{ position: "relative", display: "flex", alignSelf: "stretch" }}>
          <Sidebar items={links} collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              position: "absolute",
              top: 14,
              right: -14,
              zIndex: 30,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid var(--hairline)",
              background: "var(--card)",
              color: "var(--mute)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s ease",
            }}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        {drawer && (
          <div className="drawer">
            <Sidebar items={links} onNavigate={close} collapsed={false} />
          </div>
        )}

        <main className="mainscroll">
          <div className="page" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Guidelines assistant: floating button + right drawer */}
      <button
        type="button"
        onClick={openGuide}
        aria-label="Ask the Guidelines"
        title="Ask the Guidelines"
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 40,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "var(--primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "var(--shadow-lift)",
        }}
      >
        <BookOpenCheck size={22} strokeWidth={2.2} />
      </button>

      {guideOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          {/* ponytail: plain dim, no backdrop blur — blur made the whole app unreadable */}
          <div
            onClick={closeGuide}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(13, 37, 61, 0.35)",
              opacity: guideShown ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          />
          <aside
            role="dialog"
            aria-label="Guidelines assistant"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(430px, 100vw)",
              background: "var(--card)",
              borderLeft: "1px solid var(--hairline)",
              boxShadow: "var(--shadow-lift)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transform: guideShown ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <GuidelinesPanel onClose={closeGuide} />
          </aside>
        </div>
      )}
    </div>
  );
}
