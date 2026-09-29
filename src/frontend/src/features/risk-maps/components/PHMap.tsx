import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from "lucide-react";
import type { Hotspot } from "@/services/riskmaps/types";

// Region 1 Default Centroid (La Union / Pangasinan corridor)
const REGION_1_CENTER: [number, number] = [16.6159, 120.3209];
const DEFAULT_ZOOM = 9;

type BasemapType = "auto" | "clean" | "dark" | "satellite";

const TILE_SERVERS = {
  clean: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: "abcd",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: "abcd",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics, GIS Community",
    maxZoom: 18,
  },
};

interface PHMapProps {
  spots: Hotspot[];
  selected: Hotspot | null;
  onSelect: (s: Hotspot | null) => void;
  showDensity?: boolean;
}

export function PHMap({
  spots,
  selected,
  onSelect,
  showDensity = true,
}: PHMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const densityLayerRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<BasemapType>("auto");
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    return (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
    );
  });

  // Track theme changes on html element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark");
      setIsSystemDark(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: REGION_1_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom attribution in bottom-right
    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    densityLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Base Tile Layer based on basemap & theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeMode =
      basemap === "auto" ? (isSystemDark ? "dark" : "clean") : basemap;

    const config = TILE_SERVERS[activeMode];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: "subdomains" in config ? config.subdomains : "abc",
    }).addTo(map);

    tileLayerRef.current = newTile;
    newTile.bringToBack();
  }, [basemap, isSystemDark]);

  // Update Hotspot Markers & Density Circles
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersLayerRef.current;
    const densityGroup = densityLayerRef.current;
    if (!map || !markersGroup || !densityGroup) return;

    markersGroup.clearLayers();
    densityGroup.clearLayers();

    spots.forEach((spot) => {
      const isSelected =
        selected?.muni === spot.muni && selected?.disease === spot.disease;
      const isHigh = /high/i.test(spot.level);
      const isMed = /med|moderate/i.test(spot.level);

      const colorHex = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#2563eb";
      const diseaseShort = spot.disease.slice(0, 3).toUpperCase();

      // 1. Transmission Density Buffer Circle
      if (showDensity) {
        const radius = isHigh ? 6500 : isMed ? 4000 : 2500;
        const circle = L.circle([spot.lat, spot.lng], {
          radius,
          color: colorHex,
          weight: 1.5,
          opacity: 0.7,
          fillColor: colorHex,
          fillOpacity: isSelected ? 0.25 : 0.12,
          dashArray: isHigh ? "6, 6" : undefined,
          className: "leaflet-density-circle",
        });

        circle.on("click", () => {
          onSelect(isSelected ? null : spot);
        });

        densityGroup.addLayer(circle);
      }

      // 2. Custom Animated Pulse Marker
      const iconHtml = `
        <div class="gis-pulse-marker ${isHigh ? "gis-pulse--high" : isMed ? "gis-pulse--med" : "gis-pulse--baseline"} ${isSelected ? "gis-pulse--selected" : ""}">
          <div class="gis-pulse-ring"></div>
          <div class="gis-marker-badge">
            <span class="gis-badge-code">${diseaseShort}</span>
          </div>
          <div class="gis-marker-label">${spot.muni.split(",")[0]}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "gis-custom-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect(isSelected ? null : spot);
      });

      // Interactive Tooltip
      marker.bindTooltip(
        `<div class="p-1 font-sans text-xs">
          <div class="font-bold text-foreground">${spot.muni}</div>
          <div class="capitalize text-muted-foreground">${spot.disease} · <span class="font-bold ${isHigh ? "text-destructive" : isMed ? "text-amber-500" : "text-primary"}">${spot.level} risk</span></div>
        </div>`,
        { direction: "top", offset: [0, -18], opacity: 0.95 }
      );

      markersGroup.addLayer(marker);
    });
  }, [spots, selected, showDensity, onSelect]);

  // Fly to selected hotspot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;

    map.flyTo([selected.lat, selected.lng], 13, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selected]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    onSelect(null);
    mapRef.current?.flyTo(REGION_1_CENTER, DEFAULT_ZOOM, { duration: 1 });
  };

  const highCount = spots.filter((s) => /high/i.test(s.level)).length;
  const medCount = spots.filter((s) => /med|moderate/i.test(s.level)).length;

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-border bg-card">
      {/* Map Target Canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[520px] z-0" />

      {/* Floating Basemap Switcher (Top Right) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 p-1 bg-card/90 backdrop-blur-md rounded-lg border border-border shadow-md text-xs">
        <button
          type="button"
          onClick={() => setBasemap("clean")}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            basemap === "clean" || (basemap === "auto" && !isSystemDark)
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="Minimal Clean Slate Vector Tiles"
        >
          Clean Slate
        </button>
        <button
          type="button"
          onClick={() => setBasemap("dark")}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            basemap === "dark" || (basemap === "auto" && isSystemDark)
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="Night Ops Deep Slate Map"
        >
          Night Ops
        </button>
        <button
          type="button"
          onClick={() => setBasemap("satellite")}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            basemap === "satellite"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title="High-Resolution ESRI Satellite Imagery"
        >
          Satellite
        </button>
      </div>

      {/* Map Navigation Controls (Top Left) */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 p-1 bg-card/90 backdrop-blur-md rounded-lg border border-border shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={16} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-md flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={16} strokeWidth={2.2} />
        </button>
        <div className="h-px bg-border my-0.5" />
        <button
          type="button"
          onClick={handleReset}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Reset to Region 1 Extent"
        >
          <RotateCcw size={15} strokeWidth={2.2} />
        </button>
      </div>

      {/* Floating Status / Legend Bar (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] p-2.5 px-3 bg-card/92 backdrop-blur-md rounded-lg border border-border shadow-md flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <MapPin size={14} className="text-primary" />
          <span>{spots.length} Active Hotspots</span>
        </div>
        <div className="h-3.5 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-foreground font-medium">{highCount} High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{medCount} Watch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Baseline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
