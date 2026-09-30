import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Building, Map as MapIcon } from "lucide-react";
import type { Hotspot } from "@/services/riskmaps/types";

// Region 1 Default Centroid (Pangasinan through Ilocos Norte corridor)
const REGION_1_CENTER: [number, number] = [16.85, 120.45];
const DEFAULT_ZOOM = 8;

type BasemapType = "auto" | "clean" | "dark" | "satellite";
type GranularityLevel = "province" | "municipality" | "barangay";

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

export function getProvinceForSpot(spot: Hotspot): string {
  if (spot.province && spot.province.trim()) return spot.province.trim();
  // Geolocation inference based on latitude and longitude coordinates
  if (spot.lat < 14.95 && spot.lng > 120.8 && spot.lng < 121.4) return "Metro Manila (NCR)";
  if (spot.lat < 15.2) return "CALABARZON";
  if (spot.lat < 15.8) return "Central Luzon";
  if (spot.lat < 16.25) return "Pangasinan";
  if (spot.lat < 16.9) return "La Union";
  if (spot.lat < 17.8) return "Ilocos Sur";
  return "Ilocos Norte";
}

export function getMunicipalityForSpot(spot: Hotspot): string {
  if (spot.municipality && spot.municipality.trim()) return spot.municipality.trim();
  const parts = spot.muni.split(",");
  if (parts.length > 1) {
    return parts[1].trim();
  }
  return spot.muni.replace(/^Brgy\.\s*/i, "").trim();
}

interface GeoGroup {
  id: string;
  name: string;
  parentName?: string;
  lat: number;
  lng: number;
  items: Hotspot[];
  level: string;
  diseaseSummary: string;
  cases: number;
}

function groupByMunicipality(spots: Hotspot[]): GeoGroup[] {
  const groups: Record<string, Hotspot[]> = {};

  spots.forEach((spot) => {
    const muni = getMunicipalityForSpot(spot);
    const prov = getProvinceForSpot(spot);
    const key = `${muni}__${prov}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(spot);
  });

  return Object.entries(groups).map(([key, items]) => {
    const [muniName, provName] = key.split("__");
    const avgLat = items.reduce((acc, s) => acc + s.lat, 0) / items.length;
    const avgLng = items.reduce((acc, s) => acc + s.lng, 0) / items.length;
    const hasHigh = items.some((s) => /high/i.test(s.level));
    const hasMed = items.some((s) => /med|moderate/i.test(s.level));
    const level = hasHigh ? "high" : hasMed ? "medium" : "low";
    const totalCases = items.reduce((acc, s) => acc + (s.cases || 0), 0);

    const diseaseSet = Array.from(new Set(items.map((s) => s.disease)));
    const diseaseSummary =
      diseaseSet.length === 1
        ? diseaseSet[0].toUpperCase()
        : `${diseaseSet.length} Diseases`;

    return {
      id: `muni-${muniName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: muniName,
      parentName: provName,
      lat: avgLat,
      lng: avgLng,
      items,
      level,
      diseaseSummary,
      cases: totalCases,
    };
  });
}

function groupByProvince(spots: Hotspot[]): GeoGroup[] {
  const groups: Record<string, Hotspot[]> = {};

  spots.forEach((spot) => {
    const prov = getProvinceForSpot(spot);
    if (!groups[prov]) groups[prov] = [];
    groups[prov].push(spot);
  });

  return Object.entries(groups).map(([provName, items]) => {
    const avgLat = items.reduce((acc, s) => acc + s.lat, 0) / items.length;
    const avgLng = items.reduce((acc, s) => acc + s.lng, 0) / items.length;
    const hasHigh = items.some((s) => /high/i.test(s.level));
    const hasMed = items.some((s) => /med|moderate/i.test(s.level));
    const level = hasHigh ? "high" : hasMed ? "medium" : "low";
    const totalCases = items.reduce((acc, s) => acc + (s.cases || 0), 0);

    return {
      id: `prov-${provName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: provName,
      lat: avgLat,
      lng: avgLng,
      items,
      level,
      diseaseSummary: `${items.length} Hotspots`,
      cases: totalCases,
    };
  });
}

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
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    return (
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark")
    );
  });

  // Dynamic granularity level based on zoom
  const granularity: GranularityLevel = useMemo(() => {
    if (currentZoom <= 8.5) return "province";
    if (currentZoom < 12) return "municipality";
    return "barangay";
  }, [currentZoom]);

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

    // Track zoom updates
    const onZoom = () => {
      setCurrentZoom(map.getZoom());
    };
    map.on("zoomend", onZoom);

    mapRef.current = map;

    return () => {
      map.off("zoomend", onZoom);
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

  // Update Hotspot Markers & Density Circles based on dynamic zoom hierarchy
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersLayerRef.current;
    const densityGroup = densityLayerRef.current;
    if (!map || !markersGroup || !densityGroup || spots.length === 0) return;

    markersGroup.clearLayers();
    densityGroup.clearLayers();

    // 1. PROVINCIAL GRANULARITY (Zoomed out: zoom <= 8.5)
    if (granularity === "province") {
      const provinces = groupByProvince(spots);

      provinces.forEach((prov) => {
        const isSelected = selected && prov.items.some((s) => s.muni === selected.muni && s.disease === selected.disease);
        const isHigh = /high/i.test(prov.level);
        const isMed = /med|moderate/i.test(prov.level);
        const colorHex = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#2563eb";

        // Province Buffer Circle (regional envelope)
        if (showDensity) {
          const circle = L.circle([prov.lat, prov.lng], {
            radius: 12000,
            color: colorHex,
            weight: 2,
            opacity: 0.75,
            fillColor: colorHex,
            fillOpacity: isSelected ? 0.3 : 0.12,
            dashArray: "6, 6",
            className: "leaflet-density-circle",
          });

          circle.on("click", () => {
            map.flyTo([prov.lat, prov.lng], 10, { duration: 1.0 });
          });

          densityGroup.addLayer(circle);
        }

        const iconHtml = `
          <div class="gis-pulse-marker ${isHigh ? "gis-pulse--high" : isMed ? "gis-pulse--med" : "gis-pulse--baseline"} ${isSelected ? "gis-pulse--selected" : ""}">
            <div class="gis-pulse-ring"></div>
            <div class="gis-marker-badge" style="width: 32px; height: 32px;">
              <span class="gis-badge-code" style="font-size: 11px;">${prov.items.length}</span>
            </div>
            <div class="gis-marker-label" style="top: 34px; font-weight: 800;">${prov.name} (${prov.items.length})</div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "gis-custom-icon",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([prov.lat, prov.lng], { icon: customIcon });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          map.flyTo([prov.lat, prov.lng], 10, { duration: 1.0 });
        });

        marker.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-foreground">${prov.name}</div>
            <div class="text-muted-foreground">${prov.items.length} Monitored Hotspots · <span class="font-bold ${isHigh ? "text-destructive" : isMed ? "text-amber-500" : "text-primary"}">${prov.level.toUpperCase()} RISK</span></div>
            <div class="text-[11px] font-semibold text-foreground mt-0.5">${prov.cases} Total Active Cases</div>
            <div class="text-[10px] text-primary font-semibold mt-1">Click to zoom into municipalities &rarr;</div>
          </div>`,
          { direction: "top", offset: [0, -20], opacity: 0.95 }
        );

        markersGroup.addLayer(marker);
      });
      return;
    }

    // 2. MUNICIPALITY GRANULARITY (Mid Zoom: 8.5 < zoom < 12)
    if (granularity === "municipality") {
      const municipalities = groupByMunicipality(spots);

      municipalities.forEach((muni) => {
        const isSelected = selected && muni.items.some((s) => s.muni === selected.muni && s.disease === selected.disease);
        const isHigh = /high/i.test(muni.level);
        const isMed = /med|moderate/i.test(muni.level);
        const colorHex = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#2563eb";

        // Municipality Buffer Circle (calibrated to municipal envelope)
        if (showDensity) {
          const radius = isHigh ? 2400 : isMed ? 1900 : 1500;
          const circle = L.circle([muni.lat, muni.lng], {
            radius,
            color: colorHex,
            weight: 2,
            opacity: 0.8,
            fillColor: colorHex,
            fillOpacity: isSelected ? 0.35 : 0.16,
            dashArray: isHigh ? "5, 4" : undefined,
            className: "leaflet-density-circle",
          });

          circle.on("click", () => {
            map.flyTo([muni.lat, muni.lng], 13, { duration: 1.0 });
          });

          densityGroup.addLayer(circle);
        }

        const badgeText =
          muni.items.length === 1
            ? (muni.items[0].disease === "asthma"
                ? "AST"
                : muni.items[0].disease === "leptospirosis"
                ? "LEP"
                : muni.items[0].disease === "ili"
                ? "ILI"
                : muni.items[0].disease.slice(0, 3).toUpperCase())
            : `${muni.items.length}`;

        const iconHtml = `
          <div class="gis-pulse-marker ${isHigh ? "gis-pulse--high" : isMed ? "gis-pulse--med" : "gis-pulse--baseline"} ${isSelected ? "gis-pulse--selected" : ""}">
            <div class="gis-pulse-ring"></div>
            <div class="gis-marker-badge" style="width: 30px; height: 30px;">
              <span class="gis-badge-code">${badgeText}</span>
            </div>
            <div class="gis-marker-label" style="top: 32px;">${muni.name}${muni.items.length > 1 ? ` (${muni.items.length})` : ""}</div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "gis-custom-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([muni.lat, muni.lng], { icon: customIcon });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          map.flyTo([muni.lat, muni.lng], 13, { duration: 1.0 });
          onSelect(muni.items[0]);
        });

        marker.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-foreground">${muni.name}</div>
            <div class="text-muted-foreground">${muni.parentName || "Region 1"} · ${muni.items.length} Hotspot${muni.items.length > 1 ? "s" : ""} · <span class="font-bold ${isHigh ? "text-destructive" : isMed ? "text-amber-500" : "text-primary"}">${muni.level.toUpperCase()}</span></div>
            <div class="text-[11px] font-semibold text-foreground mt-0.5">${muni.cases} Active Cases (${muni.diseaseSummary})</div>
            <div class="text-[10px] text-primary font-semibold mt-1">Click to zoom into barangays &rarr;</div>
          </div>`,
          { direction: "top", offset: [0, -18], opacity: 0.95 }
        );

        markersGroup.addLayer(marker);
      });
      return;
    }

    // 3. BARANGAY GRANULARITY (Zoomed in: zoom >= 12)
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

      // Individual Barangay Density Circle (Calibrated to barangay footprint)
      if (showDensity) {
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

      // Animated Pulse Marker
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
  }, [spots, selected, showDensity, onSelect, granularity]);

  // Fly to selected hotspot (auto-zooms to barangay level)
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
    const map = mapRef.current;
    if (!map) return;
    if (spots.length > 0) {
      const bounds = L.latLngBounds(spots.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    } else {
      map.flyTo(REGION_1_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
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

      {/* Floating Status & Granularity Controls (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] p-2 px-3 bg-card/92 backdrop-blur-md rounded-lg border border-border shadow-md flex items-center gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <MapPin size={14} className="text-primary" />
          <span>{spots.length} Hotspots</span>
        </div>
        
        <div className="h-3.5 w-px bg-border" />

        {/* Dynamic Hierarchy Level Switcher / Indicator */}
        <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-md text-[11px]">
          <button
            type="button"
            onClick={() => mapRef.current?.flyTo(REGION_1_CENTER, 8, { duration: 0.8 })}
            className={`px-2 py-0.5 rounded font-semibold transition-all flex items-center gap-1 ${
              granularity === "province"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Switch to Province Level"
          >
            <MapIcon size={11} />
            <span>Province</span>
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.flyTo([16.6159, 120.3209], 10, { duration: 0.8 })}
            className={`px-2 py-0.5 rounded font-semibold transition-all flex items-center gap-1 ${
              granularity === "municipality"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Switch to Municipality Level"
          >
            <Building size={11} />
            <span>Municipality</span>
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.flyTo([16.6159, 120.3209], 13, { duration: 0.8 })}
            className={`px-2 py-0.5 rounded font-semibold transition-all flex items-center gap-1 ${
              granularity === "barangay"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Switch to Barangay Level"
          >
            <MapPin size={11} />
            <span>Barangay</span>
          </button>
        </div>

        <div className="h-3.5 w-px bg-border" />

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-foreground font-medium">{highCount} High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{medCount} Watch</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">{lowCount} Baseline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
