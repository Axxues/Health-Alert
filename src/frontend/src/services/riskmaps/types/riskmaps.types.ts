export interface Hotspot {
  id?: string;
  muni: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  disease: string;
  diseaseName?: string;
  level: string;
  lat: number;
  lng: number;
  cases?: number;
  probability?: number;
  sentinelFacility?: string;
}
