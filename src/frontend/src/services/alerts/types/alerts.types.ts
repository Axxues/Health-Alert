export interface Alert { id: number; kind: string; muni: string; disease: string; message: string; status: string; playbookCode: string | null; }
export interface BroadcastReq { muni: string; message: string; playbookCode: string | null; }
