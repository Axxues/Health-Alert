import { PERMISSIONS } from "@/constants/permissions";

export interface MenuItem {
  name: string;
  path: string;
  permission?: string;
  section: "Epidemiology";
}

export const menuItems: MenuItem[] = [
  // Epidemiology & Surveillance
  { name: "Dashboard", path: "/", permission: PERMISSIONS.dashboardView, section: "Epidemiology" },
  { name: "Intelligence", path: "/intelligence", section: "Epidemiology" },
  { name: "Risk maps", path: "/risk-maps", permission: PERMISSIONS.riskmapsView, section: "Epidemiology" },
  { name: "Alerts", path: "/alerts", permission: PERMISSIONS.alertsView, section: "Epidemiology" },
  { name: "Reports", path: "/reports", section: "Epidemiology" },
  { name: "Users", path: "/users", section: "Epidemiology" },
];
