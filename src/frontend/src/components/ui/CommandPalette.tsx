import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  LayoutDashboard,
  Activity,
  MapPin,
  Bell,
  FileText,
  UploadCloud,
  Users,
  Compass,
  ArrowRight,
  Shield,
  X,
} from "lucide-react";
import { getRole, getUsername } from "@/utils/auth";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: "Navigation" | "Diseases" | "Sentinel Stations";
  label: string;
  sublabel?: string;
  path: string;
  icon?: React.ReactNode;
}

const ITEMS: CommandItem[] = [
  { id: "dash", category: "Navigation", label: "Dashboard", sublabel: "Surveillance Command Center", path: "/", icon: <LayoutDashboard size={14} /> },
  { id: "intel", category: "Navigation", label: "Intelligence", sublabel: "Forecast Matrix & Sentinel Directory", path: "/intelligence", icon: <Activity size={14} /> },
  { id: "maps", category: "Navigation", label: "Risk Maps", sublabel: "Geospatial Outbreak Heatmaps", path: "/risk-maps", icon: <MapPin size={14} /> },
  { id: "alerts", category: "Navigation", label: "Alerts", sublabel: "Active Outbreak Warnings & Broadcasts", path: "/alerts", icon: <Bell size={14} /> },
  { id: "reports", category: "Navigation", label: "Reports", sublabel: "Weekly PIDSR Bulletins & Exports", path: "/reports", icon: <FileText size={14} /> },
  { id: "uploads", category: "Navigation", label: "Uploads", sublabel: "PIDSR Linelist & Population Ingestion", path: "/uploads", icon: <UploadCloud size={14} /> },
  { id: "users", category: "Navigation", label: "Users", sublabel: "User Access & Role Management", path: "/users", icon: <Users size={14} /> },

  // Diseases
  { id: "dengue", category: "Diseases", label: "Dengue Fever", sublabel: "Vector-borne · Breteau Index Surveillance", path: "/intelligence?disease=dengue", icon: <Shield size={14} /> },
  { id: "lepto", category: "Diseases", label: "Leptospirosis", sublabel: "Bacterial zoonosis · Flood & Rainfall Correlated", path: "/intelligence?disease=leptospirosis", icon: <Shield size={14} /> },
  { id: "ili", category: "Diseases", label: "Influenza-like Illness (ILI)", sublabel: "Respiratory transmission · Sentinel Clinics", path: "/intelligence?disease=ili", icon: <Shield size={14} /> },
  { id: "asthma", category: "Diseases", label: "Bronchial Asthma", sublabel: "Air quality & environmental trigger surveillance", path: "/intelligence?disease=asthma", icon: <Shield size={14} /> },

  // Sentinel Municipalities
  { id: "sfc", category: "Sentinel Stations", label: "San Fernando City", sublabel: "La Union · Region I Central Sentinel", path: "/intelligence/loc-launion-sfc", icon: <Compass size={14} /> },
  { id: "agoo", category: "Sentinel Stations", label: "Agoo", sublabel: "La Union · Southern Sentinel Hub", path: "/intelligence/loc-launion-agoo", icon: <Compass size={14} /> },
  { id: "bauang", category: "Sentinel Stations", label: "Bauang", sublabel: "La Union · Coastal Sentinel Station", path: "/intelligence/loc-launion-bauang", icon: <Compass size={14} /> },
  { id: "bacnotan", category: "Sentinel Stations", label: "Bacnotan", sublabel: "La Union · Northern Sub-Station", path: "/intelligence/loc-launion-bacnotan", icon: <Compass size={14} /> },
  { id: "sanjuan", category: "Sentinel Stations", label: "San Juan", sublabel: "La Union · Tourism & Coastal Sentinel", path: "/intelligence/loc-launion-sanjuan", icon: <Compass size={14} /> },
  { id: "baguio", category: "Sentinel Stations", label: "Baguio City", sublabel: "Benguet · Highland Surveillance Station", path: "/intelligence/loc-benguet-baguio", icon: <Compass size={14} /> },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const role = getRole();
    // ponytail: username check covers stale guest Admin sessions
    const isGuest = (getUsername() ?? "").toLowerCase() === "guest";
    return ITEMS.filter((item) => {
      if (isGuest && (item.id === "users" || item.id === "uploads")) return false;
      if (item.id === "users" && role !== "Admin") return false;
      if (item.id === "uploads" && role !== "Admin" && role !== "Encoder") return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(q))
      );
    });
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  const selectItem = (item: CommandItem) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        selectItem(filtered[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl modal-enter"
      >
        <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3 bg-muted/20">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, disease, or sentinel station..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`p-1 rounded-md shrink-0 ${isSelected ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0 truncate">
                      <span className="font-semibold block truncate">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {item.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                      {item.category}
                    </span>
                    <ArrowRight size={12} className={`opacity-0 transition-opacity ${isSelected ? "opacity-100" : ""}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/80 px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">↵</kbd> select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">esc</kbd> close</span>
          </div>
          <span className="text-[10px] font-mono">PIDSR Search Engine</span>
        </div>
      </div>
    </div>
  );
};
