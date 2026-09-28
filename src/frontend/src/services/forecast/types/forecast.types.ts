export interface ForecastOutlook {
  probability: number;
  band: string;
  drivers: string[];
}

export interface ForecastRunReq {
  disease?: string;
  muni?: string;
}
