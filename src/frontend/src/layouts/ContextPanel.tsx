import { NavLink } from "react-router";
import type { menuItems } from "@/constants/layout/menu/menu";

export function ContextPanel({ items, onNavigate }: {
  items: typeof menuItems;
  onNavigate?: () => void;
}) {
  return (
    <nav className="ctxpanel" aria-label="Sections">
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
                {m.name}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
