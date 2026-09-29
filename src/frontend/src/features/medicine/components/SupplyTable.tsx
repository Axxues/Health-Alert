import { Pill, AlertTriangle, ShieldCheck, Plus } from "lucide-react";

export interface MedicineItem {
  id: string;
  name: string;
  category: string;
  targetDisease: string;
  currentStock: number;
  unit: string;
  targetStock: number;
  burnRatePerDay: number;
  expiryDate: string;
  batchLot: string;
}

export const INITIAL_SUPPLIES: MedicineItem[] = [
  {
    id: "MED-001",
    name: "Oral Rehydration Salts (ORS) 20.5g",
    category: "Electrolyte Resuscitation",
    targetDisease: "Dengue Dehydration",
    currentStock: 4250,
    unit: "sachets",
    targetStock: 5000,
    burnRatePerDay: 85,
    expiryDate: "2027-08-15",
    batchLot: "LOT-ORS-2409",
  },
  {
    id: "MED-002",
    name: "Doxycycline 100mg Capsules",
    category: "Prophylaxis Antibiotic",
    targetDisease: "Leptospirosis Post-Flood",
    currentStock: 620,
    unit: "capsules",
    targetStock: 2500,
    burnRatePerDay: 140,
    expiryDate: "2027-04-10",
    batchLot: "LOT-DOX-2411",
  },
  {
    id: "MED-003",
    name: "D5 0.9% NaCl Infusion (1,000 mL)",
    category: "Intravenous Plasma Expander",
    targetDisease: "Severe Dengue Shock",
    currentStock: 340,
    unit: "bags",
    targetStock: 600,
    burnRatePerDay: 18,
    expiryDate: "2028-01-20",
    batchLot: "LOT-IVF-2501",
  },
  {
    id: "MED-004",
    name: "Dengue NS1 Antigen Rapid Test Kits",
    category: "Point-of-Care Diagnostics",
    targetDisease: "Early Dengue Triage",
    currentStock: 190,
    unit: "tests",
    targetStock: 800,
    burnRatePerDay: 35,
    expiryDate: "2026-12-30",
    batchLot: "LOT-NS1-2408",
  },
  {
    id: "MED-005",
    name: "Salbutamol 2.5mg/2.5mL Respules",
    category: "Bronchodilator Inhalation",
    targetDisease: "Asthma & Particulate Spikes",
    currentStock: 780,
    unit: "respules",
    targetStock: 1000,
    burnRatePerDay: 22,
    expiryDate: "2027-09-15",
    batchLot: "LOT-SAL-2410",
  },
  {
    id: "MED-006",
    name: "Paracetamol 500mg Tablets",
    category: "Analgesic / Antipyretic",
    targetDisease: "Flu-like Illness & Fever",
    currentStock: 12400,
    unit: "tablets",
    targetStock: 15000,
    burnRatePerDay: 180,
    expiryDate: "2028-05-10",
    batchLot: "LOT-PCM-2503",
  },
];

export function SupplyTable({
  supplies,
  onRequest,
}: {
  supplies: MedicineItem[];
  onRequest: (itemName: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-muted/40 text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Item & Formulation</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Target Outbreak Protocol</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Stock Level</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Days Reserve (Burn Rate)</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Batch / Expiry</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Requisition</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {supplies.map((s) => {
            const daysLeft = Math.floor(s.currentStock / Math.max(1, s.burnRatePerDay));
            const isCritical = daysLeft <= 7;
            const pct = Math.min(100, Math.round((s.currentStock / s.targetStock) * 100));

            return (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        isCritical
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      <Pill size={15} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-[13px]">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {s.id} · {s.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    {s.targetDisease}
                  </span>
                </td>
                <td className="px-4 py-3 min-w-[150px]">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="font-bold text-foreground">
                        {s.currentStock.toLocaleString()} {s.unit}
                      </span>
                      <span className="text-muted-foreground">
                        Target: {s.targetStock.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCritical
                            ? "bg-rose-500"
                            : pct < 60
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      <AlertTriangle size={12} strokeWidth={2.2} />
                      <span>{daysLeft} days ({s.burnRatePerDay}/d)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={12} strokeWidth={2.2} />
                      <span>{daysLeft} days reserve</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[11px]">
                  <div className="font-medium text-foreground">{s.expiryDate}</div>
                  <div className="text-muted-foreground">{s.batchLot}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRequest(s.name)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isCritical
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <Plus size={13} strokeWidth={2.2} />
                    <span>Restock</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
