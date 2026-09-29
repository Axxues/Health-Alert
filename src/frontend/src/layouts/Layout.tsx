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
          HA
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
          <div style={{ padding: "6px 12px 10px", borderBottom: "1px solid var(--hairline)", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink)" }}>Dr. Maria Santos</div>
            <div style={{ fontSize: "11.5px", color: "var(--mute)" }}>mho.sanfernando@doh.gov.ph</div>
          </div>
          <Link
            to="/users"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <User size={15} strokeWidth={2.2} />
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
            <LogOut size={15} strokeWidth={2.2} />
            <span>Sign Out</span>
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
        <button
          className="iconbtn drawerbtn"
          onClick={() => setDrawer(true)}
          aria-label="Open navigation"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <Link to="/" className="brandlink">
          <img src="/Health-Nology_StartupLogo_PSC11_2.png" alt="Health Alert logo" />
          <span>Health Alert</span>
        </Link>

        <label className="search">
          <Search size={16} strokeWidth={2.2} style={{ color: "var(--mute)", flex: "none" }} />
          <input
            placeholder="Search hotspots, barangays, diseases (⌘K)"
            aria-label="Search"
          />
          <span className="kbd">⌘K</span>
        </label>

        <div className="who">
          <ThemeToggle />
          <Link to="/messaging" className="iconbtn" aria-label="Messages" title="Inter-agency Messaging">
            <Mail size={17} strokeWidth={2.2} />
          </Link>
          <Link
            to="/alerts"
            className="iconbtn"
            aria-label="Outbreak Alerts"
            title="Active Outbreak Alerts"
            style={{ position: "relative" }}
          >
            <Bell size={17} strokeWidth={2.2} />
            <span
              className="dot dot--pulse"
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                background: "var(--red)",
                boxShadow: "0 0 8px var(--red)",
              }}
            />
          </Link>
          <Profile />
        </div>
      </header>

      <div className="below">
        {drawer && <div className="overlay" onClick={close} />}
        <Sidebar items={links} />
        {drawer && (
          <div className="drawer">
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
