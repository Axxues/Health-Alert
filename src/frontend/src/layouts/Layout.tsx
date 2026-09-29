import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Menu,
  Search,
  Bell,
  Mail,
  LogOut,
  ChevronDown,
  User,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
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
          <Link
            to="/users"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <User size={14} strokeWidth={2} />
            <span>Account & Access</span>
          </Link>
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
  const { pathname } = useLocation();
  const links = menuItems.filter((m) => !m.permission || hasPermission(m.permission));
  const close = () => setDrawer(false);

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

          <Link to="/messaging" className="iconbtn" aria-label="Messages" title="Inter-agency Messaging">
            <Mail size={16} strokeWidth={2} />
          </Link>

          <Link
            to="/alerts"
            className="iconbtn"
            aria-label="Outbreak Alerts"
            title="Active Outbreak Alerts"
            style={{ position: "relative" }}
          >
            <Bell size={16} strokeWidth={2} />
            <span
              className="dot dot--pulse"
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                background: "var(--red)",
              }}
            />
          </Link>

          <Profile />
        </div>
      </header>

      <div className="below">
        {drawer && <div className="overlay" onClick={close} />}

        <div style={{ position: "relative" }}>
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
    </div>
  );
}
