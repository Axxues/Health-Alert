import { NavLink } from "react-router";
import {
  LayoutDashboard,
  TrendingUp,
  Radio,
  MapPin,
  BookOpenCheck,
  Workflow,
  BellRing,
  UsersRound,
  Pill,
  FileBarChart,
  MessageSquare,
  UserCheck,
  Cpu,
} from "lucide-react";
import { menuItems } from "@/constants/layout/menu/menu";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={18} strokeWidth={2.2} />,
  Forecast: <TrendingUp size={18} strokeWidth={2.2} />,
  Surveillance: <Radio size={18} strokeWidth={2.2} />,
  "Risk maps": <MapPin size={18} strokeWidth={2.2} />,
  "Ask the library": <BookOpenCheck size={18} strokeWidth={2.2} />,
  Playbooks: <Workflow size={18} strokeWidth={2.2} />,
  Alerts: <BellRing size={18} strokeWidth={2.2} />,
  Citizen: <UsersRound size={18} strokeWidth={2.2} />,
  "Medicine & Supplies": <Pill size={18} strokeWidth={2.2} />,
  Reports: <FileBarChart size={18} strokeWidth={2.2} />,
  Messaging: <MessageSquare size={18} strokeWidth={2.2} />,
  Users: <UserCheck size={18} strokeWidth={2.2} />,
  System: <Cpu size={18} strokeWidth={2.2} />,
};

export function Sidebar({
  items,
  onNavigate,
}: {
  items: typeof menuItems;
  onNavigate?: () => void;
}) {
  return (
    <nav className="sidebar" aria-label="Primary navigation">
      <div style={{ flex: 1 }}>
        {(["Epidemiology", "Outbreak Response", "Administration"] as const).map((sec) => {
          const list = items.filter((m) => m.section === sec);
          if (list.length === 0) return null;
          return (
            <div key={sec} style={{ marginBottom: 12 }}>
              <div className="navsec">{sec}</div>
              {list.map((m) => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  end={m.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <span className="navicon" aria-hidden="true">
                    {iconMap[m.name] ?? null}
                  </span>
                  <span>{m.name}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "12px 14px",
          background: "var(--card-subtle)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-md)",
          fontSize: "12px",
          lineHeight: 1.4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
          <span className="dot" style={{ color: "var(--green)" }} />
          <span>LGU Surveillance Unit</span>
        </div>
        <div style={{ color: "var(--mute)", fontSize: "11px" }}>
          Region I Multi-Syndromic Sentinel
        </div>
      </div>
    </nav>
  );
}
