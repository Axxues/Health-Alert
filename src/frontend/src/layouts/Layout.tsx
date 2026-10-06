import { useEffect, useRef, useState, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Menu,
  Search,
  LogOut,
  ChevronDown,
  BookOpenCheck,
  ChevronRight,
  User,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { menuItems } from "@/constants/layout/menu/menu";
import { clearSession, getRole, getUsername, hasPermission } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GuidelinesPanel } from "@/features/rag/components/GuidelinesPanel";
import { CommandPalette } from "@/components/ui/CommandPalette";

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
  // ponytail: guest logs in as Admin role; label by username so header reads Guest Mode
  const isGuest = (getUsername() ?? "").toLowerCase() === "guest";
  const shortName = isGuest ? "Guest Mode" : "Dr. M. Santos";
  const fullName = isGuest ? "Guest Mode" : "Dr. Maria Santos";
  const email = isGuest ? "Demo access" : "mho.sanfernando@doh.gov.ph";
  const initials = isGuest ? "G" : "MS";
  const roleLabel = isGuest ? "Guest Mode" : role;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer shadow-xs"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {initials}
        </span>
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="font-bold text-xs text-foreground">{shortName}</span>
          <span className="text-[10px] text-muted-foreground">{roleLabel}</span>
        </div>
        <ChevronDown
          size={13}
          className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg z-50 text-xs animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 border-b border-border/60 mb-1">
            <div className="font-bold text-foreground">{fullName}</div>
            <div className="text-[11px] text-muted-foreground truncate">{email}</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <User size={10} />
              {roleLabel}
            </div>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              clearSession();
              navigate("/login");
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer font-medium"
          >
            <LogOut size={14} />
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideShown, setGuideShown] = useState(false);
  const guideTimer = useRef<number | null>(null);
  const { pathname } = useLocation();

  const links = useMemo(
    () =>
      menuItems.filter(
        (m) =>
          (!m.permission || hasPermission(m.permission)) &&
          (m.path !== "/users" || getRole() === "Admin") &&
          (m.path !== "/uploads" || getRole() === "Admin" || getRole() === "Encoder")
      ),
    []
  );

  const closeDrawer = () => setDrawer(false);

  // Keyboard shortcut listener for Command+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Guidelines drawer animation
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

  // Dynamic breadcrumbs based on pathname
  const breadcrumbs = useMemo(() => {
    if (pathname === "/") return [{ label: "Surveillance" }, { label: "Command Center" }];
    if (pathname.startsWith("/intelligence/")) return [{ label: "Intelligence", path: "/intelligence" }, { label: "Sentinel Deep-Dive" }];
    if (pathname === "/intelligence") return [{ label: "Intelligence" }, { label: "Forecast Matrix" }];
    if (pathname === "/risk-maps") return [{ label: "Surveillance" }, { label: "Geospatial Risk Maps" }];
    if (pathname === "/alerts") return [{ label: "Operations" }, { label: "Alert Ledger" }];
    if (pathname === "/reports") return [{ label: "Operations" }, { label: "PIDSR Reports" }];
    if (pathname === "/uploads") return [{ label: "Administration" }, { label: "Linelist Uploads" }];
    if (pathname === "/users") return [{ label: "Administration" }, { label: "User Access Directory" }];
    return [{ label: "HealthAlert" }];
  }, [pathname]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Topbar Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 sm:px-6 backdrop-blur-md z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="flex sm:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <Menu size={18} />
          </button>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-sm tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <img
              src="/Health-Nology_StartupLogo_PSC11_2.png"
              alt="HealthAlert Logo"
              className="h-7 w-7 object-contain drop-shadow-2xs"
            />
            <span className="font-extrabold tracking-tight">HealthAlert</span>
          </Link>

          <div className="hidden md:flex h-4 w-px bg-border/80 mx-1" />

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumbs" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumbs.map((b, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight size={11} className="text-muted-foreground/50" />}
                {b.path ? (
                  <Link to={b.path} className="hover:text-foreground transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className={idx === breadcrumbs.length - 1 ? "font-semibold text-foreground" : ""}>
                    {b.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Center / Search & Command Palette Trigger */}
        <div className="flex-1 max-w-sm mx-4 hidden sm:block">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-input bg-muted/40 hover:bg-muted/70 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-muted-foreground" />
              <span>Search hotspots, diseases, pages...</span>
            </div>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Ticker, Theme Toggle, Profile */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Profile />
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Mobile Navigation Drawer Overlay */}
        {drawer && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs transition-opacity sm:hidden"
            onClick={closeDrawer}
          />
        )}

        {/* Desktop Sidebar */}
        <div className="hidden sm:flex shrink-0">
          <Sidebar
            items={links}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {drawer && (
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-2xl sm:hidden">
            <Sidebar items={links} onNavigate={closeDrawer} collapsed={false} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-muted/15 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in-0 duration-200" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Guidelines Assistant Trigger Button */}
      <button
        type="button"
        onClick={openGuide}
        aria-label="Ask Clinical Guidelines"
        title="Ask Clinical Guidelines"
        className="fixed right-6 bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <BookOpenCheck size={20} strokeWidth={2.2} />
      </button>

      {/* Guidelines Assistant Slide-Over Drawer */}
      {guideOpen && (
        <div className="fixed inset-0 z-50">
          <div
            onClick={closeGuide}
            className={`fixed inset-0 bg-background/60 backdrop-blur-xs transition-opacity duration-200 ${
              guideShown ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            role="dialog"
            aria-label="Clinical guidelines assistant"
            className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md border-l border-border bg-card shadow-2xl transition-transform duration-200 ease-out flex flex-col ${
              guideShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <GuidelinesPanel onClose={closeGuide} />
          </aside>
        </div>
      )}

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
