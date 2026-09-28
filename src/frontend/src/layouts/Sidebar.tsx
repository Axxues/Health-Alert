import { NavLink } from "react-router";
import { menuItems } from "@/constants/layout/menu/menu";
import { hasPermission } from "@/utils/auth";

// ponytail: inline glyphs, no icon lib for 12 marks
const glyphs: Record<string, string> = {
  Dashboard: "▦",
  Forecast: "◔",
  Surveillance: "◎",
  "Risk maps": "▤",
  "Ask the library": "✎",
  Playbooks: "☰",
  Alerts: "♪",
  Citizen: "☺",
  Reports: "▦",
  Messaging: "✉",
  Users: "⚙",
  System: "◍",
};

export function Sidebar() {
  const links = menuItems.filter((m) => !m.permission || hasPermission(m.permission));
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="brand">
        <span className="mark">◉</span> Health Alert
      </div>
      {(["Menu", "General"] as const).map((sec) => (
        <div key={sec}>
          <div className="navsec">{sec.toUpperCase()}</div>
          {links
            .filter((m) => m.section === sec)
            .map((m) => (
              <NavLink key={m.path} to={m.path} end={m.path === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
                <span aria-hidden>{glyphs[m.name] ?? "·"}</span> {m.name}
              </NavLink>
            ))}
        </div>
      ))}
    </nav>
  );
}
