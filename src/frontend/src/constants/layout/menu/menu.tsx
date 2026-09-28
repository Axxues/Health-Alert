import { PERMISSIONS } from "@/constants/permissions";

export interface MenuItem {
  name: string;
  path: string;
  permission?: string;
  section: "Menu" | "General";
}

// ponytail: single menu tree; Sidebar filters by permission. Unguarded items have no permission.
export const menuItems: MenuItem[] = [
  { name: "Dashboard", path: "/", permission: PERMISSIONS.dashboardView, section: "Menu" },
  { name: "Forecast", path: "/forecast", permission: PERMISSIONS.forecastView, section: "Menu" },
  { name: "Surveillance", path: "/surveillance", permission: PERMISSIONS.surveillanceView, section: "Menu" },
  { name: "Risk maps", path: "/risk-maps", permission: PERMISSIONS.riskmapsView, section: "Menu" },
  { name: "Ask the library", path: "/rag", permission: PERMISSIONS.ragView, section: "Menu" },
  { name: "Playbooks", path: "/playbooks", permission: PERMISSIONS.playbookView, section: "Menu" },
  { name: "Alerts", path: "/alerts", permission: PERMISSIONS.alertsView, section: "Menu" },
  { name: "Citizen", path: "/citizen", permission: PERMISSIONS.citizenView, section: "Menu" },
  { name: "Reports", path: "/reports", section: "General" },
  { name: "Messaging", path: "/messaging", section: "General" },
  { name: "Users", path: "/users", section: "General" },
  { name: "System", path: "/system", section: "General" },
];
