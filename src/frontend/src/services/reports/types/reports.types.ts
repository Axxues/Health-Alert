export interface DiseaseRow { disease: string; cases: number; prevCases: number; changePct: number; }
export interface WeeklyBulletin { week: string; diseases: DiseaseRow[]; hotspots: string[]; activeAlerts: string[]; }
export interface CaseExportRow { date: string; muni: string; disease: string; count: number; }
