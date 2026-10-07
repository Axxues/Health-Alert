import type { Hotspot } from "@/services/riskmaps/types";

export interface GeoGroup {
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

export function getProvinceForSpot(spot: Hotspot): string {
  if (spot.province && spot.province.trim()) return spot.province.trim();
  // Geolocation inference based on latitude and longitude coordinates
  if (spot.lat < 9.5) return "Mindanao";
  if (spot.lat < 12.0) return "Visayas";
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

// Node counts are distinct barangays, not disease rows
export function barangayCount(items: Hotspot[]): number {
  return new Set(items.map((s) => `${s.muni}__${s.barangay || ""}`)).size;
}

export function groupByMunicipality(spots: Hotspot[]): GeoGroup[] {
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

export function groupByProvince(spots: Hotspot[]): GeoGroup[] {
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

export function shortForDisease(disease: string): string {
  const d = disease.toLowerCase();
  if (d === "asthma") return "AST";
  if (d === "leptospirosis") return "LEP";
  if (d === "ili") return "ILI";
  return disease.slice(0, 3).toUpperCase();
}

export function getBarangayDensityRadius(level: string, zoom: number): number {
  const isHigh = /high/i.test(level);
  const isMed = /med|moderate/i.test(level);

  // Approximate meters per pixel across Region I latitudes (~16.5° N):
  // metersPerPixel ≈ (156543 * cos(16.5°)) / 2^zoom ≈ 150000 / 2^zoom
  const metersPerPx = 150000 / Math.pow(2, zoom);

  // Target visual halo radius in pixels around the compact 24px badge (12px radius):
  // High: ~24px radius (48px halo diameter)
  // Med: ~19px radius (38px halo diameter)
  // Baseline: ~15px radius (30px halo diameter)
  const targetPx = isHigh ? 24 : isMed ? 19 : 15;
  const computedMeters = targetPx * metersPerPx;

  // Clamped bounds so the density circle remains a focused, localized perimeter
  // and never balloons into adjacent barangays (~200m away) or vanishes under the badge:
  const minMeters = isHigh ? 80 : isMed ? 65 : 50;
  const maxMeters = isHigh ? 220 : isMed ? 160 : 120;

  return Math.max(minMeters, Math.min(maxMeters, computedMeters));
}
