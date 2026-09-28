import { NavLink } from "react-router";

const links = [
  ["/", "Dashboard"],
  ["/forecast", "Forecast"],
  ["/surveillance", "Surveillance"],
  ["/risk-maps", "Risk maps"],
  ["/rag", "Ask the library"],
  ["/playbooks", "Playbooks"],
  ["/alerts", "Alerts"],
  ["/citizen", "Citizen"],
  ["/reports", "Reports"],
  ["/messaging", "Messaging"],
  ["/users", "Users"],
  ["/system", "System"],
] as const;

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      {links.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
