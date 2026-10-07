export interface Alert { id: number; kind: string | null; muni: string | null; disease: string | null; message: string | null; status: string | null; playbookCode: string | null; }
export interface BroadcastReq { muni: string; message: string; playbookCode: string | null; }
