import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from "lucide-react";
import type { Hotspot } from "@/services/riskmaps/types";

// Region 1 Default Centroid (Pangasinan through Ilocos Norte corridor)
const REGION_1_CENTER: [number, number] = [16.85, 120.45];
const DEFAULT_ZOOM = 8;

type BasemapType = "auto" | "clean" | "dark" | "satellite";

interface TileConfig {
  base: string;
  reference?: string;
  attribution: string;
  maxZoom: number;
  maxNativeZoom?: number;
}

const TILE_SERVERS: Record<"clean" | "dark" | "satellite", TileConfig> = {
  clean: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    reference: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    maxZoom: 19,
    maxNativeZoom: 16,
  },
  dark: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    reference: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    maxZoom: 19,
    maxNativeZoom: 16,
  },
  satellite: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    reference: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics, GIS Community",
    maxZoom: 19,
    maxNativeZoom: 18,
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
  const basemapGroupRef = useRef<L.LayerGroup | null>(null);
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
      basemapGroupRef.current = null;
    };
  }, []);

  // Update Base Tile Layer based on basemap & theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeMode =
      basemap === "auto" ? (isSystemDark ? "dark" : "clean") : basemap;

    const config = TILE_SERVERS[activeMode];

    if (basemapGroupRef.current) {
      map.removeLayer(basemapGroupRef.current);
    }

    const group = L.layerGroup();

    // Base tiles
    const baseLayer = L.tileLayer(config.base, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom ?? config.maxZoom,
    });
    group.addLayer(baseLayer);

    // Reference/Label tiles if present
    if (config.reference) {
      const refLayer = L.tileLayer(config.reference, {
        maxZoom: config.maxZoom,
        maxNativeZoom: config.maxNativeZoom ?? config.maxZoom,
        opacity: 0.95,
      });
      group.addLayer(refLayer);
    }

    group.addTo(map);
    basemapGroupRef.current = group;

    baseLayer.bringToBack();
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
      const diseaseShort =
        spot.disease.toLowerCase() === "asthma"
          ? "AST"
          : spot.disease.toLowerCase() === "leptospirosis"
          ? "LEP"
          : spot.disease.toLowerCase() === "ili"
          ? "ILI"
          : spot.disease.slice(0, 3).toUpperCase();

      // 1. Transmission Density Buffer Circle (Calibrated to barangay footprint)
      if (showDensity) {
        // Standard Philippine barangay jurisdiction radius (~380m to 650m)
        const radius = isHigh ? 650 : isMed ? 500 : 380;
        const circle = L.circle([spot.lat, spot.lng], {
          radius,
          color: colorHex,
          weight: 2,
          opacity: 0.85,
          fillColor: colorHex,
          fillOpacity: isSelected ? 0.35 : 0.18,
          dashArray: isHigh ? "5, 4" : undefined,
          className: "leaflet-density-circle",
        });

        circle.on("click", () => {
          onSelect(isSelected ? null : spot);
        });

        densityGroup.addLayer(circle);
      }

      // 2. Custom Animated Pulse Marker
      const labelText = spot.barangay || spot.muni.split(",")[0].replace(/^Brgy\.\s*/i, "");
      const iconHtml = `
        <div class="gis-pulse-marker ${isHigh ? "gis-pulse--high" : isMed ? "gis-pulse--med" : "gis-pulse--baseline"} ${isSelected ? "gis-pulse--selected" : ""}">
          <div class="gis-pulse-ring"></div>
          <div class="gis-marker-badge">
            <span class="gis-badge-code">${diseaseShort}</span>
          </div>
          <div class="gis-marker-label">${labelText}</div>
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
          <div class="capitalize text-muted-foreground">${spot.diseaseName || spot.disease} · <span class="font-bold ${isHigh ? "text-destructive" : isMed ? "text-amber-500" : "text-primary"}">${spot.level} risk</span></div>
          ${spot.cases !== undefined ? `<div class="text-[11px] font-semibold text-foreground mt-0.5">${spot.cases} Active Cases (${Math.round((spot.probability ?? 0) * 100)}% Surge Prob.)</div>` : ""}
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
  const lowCount = spots.filter((s) => /low|routine|baseline/i.test(s.level)).length;

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
            <span className="text-muted-foreground">{lowCount} Baseline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
