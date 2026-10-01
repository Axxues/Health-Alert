import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Bell,
  FileText,
  Shield,
} from "lucide-react";
import { menuItems } from "@/constants/layout/menu/menu";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={18} strokeWidth={2} />,
  Intelligence: <Activity size={18} strokeWidth={2} />,
  "Risk maps": <MapPin size={18} strokeWidth={2} />,
  Alerts: <Bell size={18} strokeWidth={2} />,
  Reports: <FileText size={18} strokeWidth={2} />,
};

export function Sidebar({
  items,
  onNavigate,
  collapsed = false,
}: {
  items: typeof menuItems;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav
      className="sidebar"
      aria-label="Primary navigation"
      style={{
        width: collapsed ? 68 : 240,
        minWidth: collapsed ? 68 : 240,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto" }}>
        {(["Epidemiology"] as const).map((sec) => {
          const list = items.filter((m) => m.section === sec);
          if (list.length === 0) return null;
          return (
            <div key={sec} style={{ marginBottom: 12 }}>
              {!collapsed && (
                <div
                  className="navsec"
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--mute)",
                    padding: "0 12px 6px",
                  }}
                >
                  {sec}
                </div>
              )}
              {list.map((m) => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  end={m.path === "/"}
                  onClick={onNavigate}
                  title={collapsed ? m.name : undefined}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "8px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "var(--radius-md)",
                    marginBottom: 2,
                    textDecoration: "none",
                  }}
                >
                  <span
                    className="navicon"
                    aria-hidden="true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "inherit",
                    }}
                  >
                    {iconMap[m.name] ?? null}
                  </span>
                  {!collapsed && <span style={{ fontSize: "13px", fontWeight: 600 }}>{m.name}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          flexShrink: 0,
          position: "sticky",
          bottom: 0,
          padding: collapsed ? "10px 4px" : "12px 14px",
          background: "var(--card-subtle)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-md)",
          fontSize: "12px",
          lineHeight: 1.4,
          textAlign: collapsed ? "center" : "left",
        }}
      >
        {collapsed ? (
          <div title="LGU Surveillance Unit Active" style={{ display: "flex", justifyContent: "center" }}>
            <Shield size={16} style={{ color: "var(--green)" }} />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
              <span className="dot" style={{ color: "var(--green)" }} />
              <span>LGU Sentinel Unit</span>
            </div>
            <div style={{ color: "var(--mute)", fontSize: "11px" }}>Philippine National Multi-Syndromic</div>
          </>
        )}
      </div>
    </nav>
  );
}
