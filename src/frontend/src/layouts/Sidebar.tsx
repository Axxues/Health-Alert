import React from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Bell,
  FileText,
  UploadCloud,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { MenuItem, MenuSection } from "@/constants/layout/menu/menu";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={16} strokeWidth={2.2} />,
  Intelligence: <Activity size={16} strokeWidth={2.2} />,
  "Risk maps": <MapPin size={16} strokeWidth={2.2} />,
  Alerts: <Bell size={16} strokeWidth={2.2} />,
  Reports: <FileText size={16} strokeWidth={2.2} />,
  Uploads: <UploadCloud size={16} strokeWidth={2.2} />,
  Users: <Users size={16} strokeWidth={2.2} />,
};

const SECTIONS: MenuSection[] = [
  "Surveillance & Telemetry",
  "Incident Operations",
  "Administration",
];

export interface SidebarProps {
  items: MenuItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  items,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      aria-label="Primary navigation"
      className={`relative flex flex-col h-full bg-card/95 backdrop-blur-md border-r border-border transition-all duration-300 ease-in-out select-none z-20 ${
        collapsed ? "w-16 min-w-16" : "w-60 min-w-60"
      }`}
    >
      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5 py-4 scrollbar-none">
        {SECTIONS.map((sec) => {
          const list = items.filter((m) => m.section === sec);
          if (list.length === 0) return null;

          return (
            <div key={sec} className="space-y-1">
              {!collapsed ? (
                <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {sec}
                </div>
              ) : (
                <div className="h-2" />
              )}

              {list.map((m) => (
                <NavLink
                  key={m.path}
                  to={m.path}
                  end={m.path === "/"}
                  onClick={onNavigate}
                  title={collapsed ? m.name : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] ${
                      collapsed ? "justify-center p-2.5" : "px-3 py-2 hover:translate-x-1"
                    } ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator rail */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-primary transition-all duration-200 ease-out" />
                      )}

                      <span
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {iconMap[m.name] ?? null}
                      </span>

                      {!collapsed && <span className="truncate">{m.name}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer Area with Telemetry Status & Collapse Toggle */}
      <div className="p-3 border-t border-border/80 bg-muted/20 space-y-2">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span className="text-[11px]">Collapse sidebar</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
