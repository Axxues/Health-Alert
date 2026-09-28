import { NavLink } from "react-router";
import { menuItems } from "@/constants/layout/menu/menu";

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

export function Rail({ items, onNavigate }: {
  items: typeof menuItems;
  onNavigate?: () => void;
}) {
  return (
    <nav className="rail" aria-label="Primary">
      {items.map((m) => (
        <NavLink
          key={m.path} to={m.path} end={m.path === "/"}
          title={m.name} onClick={onNavigate}
          className={({ isActive }) => `railbtn${isActive ? " railbtn--on" : ""}`}
        >
          <span aria-hidden>{glyphs[m.name] ?? "·"}</span>
        </NavLink>
      ))}
    </nav>
  );
}
