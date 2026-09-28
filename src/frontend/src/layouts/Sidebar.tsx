import { NavLink } from "react-router";
import { menuItems } from "@/constants/layout/menu/menu";

// ponytail: inline stroke icons, no icon lib for 12 marks
function I({ d }: { d: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d}
    </svg>
  );
}

const icons: Record<string, React.ReactNode> = {
  Dashboard: <I><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></I>,
  Forecast: <I><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></I>,
  Surveillance: <I><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></I>,
  "Risk maps": <I><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></I>,
  "Ask the library": <I><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 0 2 2h13" /></I>,
  Playbooks: <I><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></I>,
  Alerts: <I><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></I>,
  Citizen: <I><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></I>,
  Reports: <I><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4" /><path d="M9 13h6M9 17h6" /></I>,
  Messaging: <I><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></I>,
  Users: <I><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2" /><circle cx="10" cy="16" r="2" /></I>,
  System: <I><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></I>,
};

export function Sidebar({ items, onNavigate }: {
  items: typeof menuItems;
  onNavigate?: () => void;
}) {
  return (
    <nav className="sidebar" aria-label="Primary">
      {(["Menu", "General"] as const).map((sec) => {
        const list = items.filter((m) => m.section === sec);
        if (list.length === 0) return null;
        return (
          <div key={sec}>
            <div className="navsec">{sec.toUpperCase()}</div>
            {list.map((m) => (
              <NavLink
                key={m.path} to={m.path} end={m.path === "/"}
                onClick={onNavigate}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="navicon" aria-hidden>{icons[m.name] ?? null}</span> {m.name}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
