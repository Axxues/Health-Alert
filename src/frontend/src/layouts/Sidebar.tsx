import { NavLink } from "react-router";
import { menuItems } from "@/constants/layout/menu/menu";
import { hasPermission } from "@/utils/auth";

export function Sidebar() {
  const links = menuItems.filter((m) => !m.permission || hasPermission(m.permission));
  return (
    <nav className="sidebar" aria-label="Primary">
      {links.map((m) => (
        <NavLink key={m.path} to={m.path} end={m.path === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
          {m.name}
        </NavLink>
      ))}
    </nav>
  );
}
