import { PERMISSIONS } from "@/constants/permissions";

export interface MenuItem {
  name: string;
  path: string;
  permission?: string;
}

// ponytail: single menu tree; Sidebar filters by permission. Unguarded items have no permission.
export const menuItems: MenuItem[] = [
  { name: "Dashboard", path: "/", permission: PERMISSIONS.dashboardView },
  { name: "Forecast", path: "/forecast", permission: PERMISSIONS.forecastView },
  { name: "Surveillance", path: "/surveillance", permission: PERMISSIONS.surveillanceView },
  { name: "Risk maps", path: "/risk-maps", permission: PERMISSIONS.riskmapsView },
  { name: "Ask the library", path: "/rag", permission: PERMISSIONS.ragView },
  { name: "Playbooks", path: "/playbooks", permission: PERMISSIONS.playbookView },
  { name: "Alerts", path: "/alerts", permission: PERMISSIONS.alertsView },
  { name: "Citizen", path: "/citizen", permission: PERMISSIONS.citizenView },
  { name: "Reports", path: "/reports" },
  { name: "Messaging", path: "/messaging" },
  { name: "Users", path: "/users" },
  { name: "System", path: "/system" },
];
