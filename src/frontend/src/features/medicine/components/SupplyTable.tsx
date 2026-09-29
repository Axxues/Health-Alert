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
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item & Formulation</th>
            <th>Target Outbreak Protocol</th>
            <th>Stock Health</th>
            <th>Days Remaining (Burn Rate)</th>
            <th>Batch / Expiry</th>
            <th style={{ textAlign: "right" }}>Requisition</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {supplies.map((s) => {
            const daysLeft = Math.floor(s.currentStock / Math.max(1, s.burnRatePerDay));
            const isCritical = daysLeft <= 7;
            const pct = Math.min(100, Math.round((s.currentStock / s.targetStock) * 100));

            return (
              <tr key={s.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="glyph"
                      style={{
                        background: isCritical ? "var(--red-bg)" : "var(--primary-light)",
                        color: isCritical ? "var(--red)" : "var(--primary)",
                      }}
                    >
                      <Pill size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "13.5px" }}>{s.name}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--mute)" }}>{s.id} · {s.category}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pill pill--primary" style={{ fontSize: "11.5px" }}>
                    {s.targetDisease}
                  </span>
                </td>
                <td>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: 3 }}>
                      <b>{s.currentStock.toLocaleString()} {s.unit}</b>
                      <span className="muted">Target: {s.targetStock.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, width: 140, background: "var(--backdrop)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isCritical ? "var(--red)" : pct < 60 ? "var(--amber)" : "var(--green)",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  {isCritical ? (
                    <span className="pill pill--bad">
                      <AlertTriangle size={12} strokeWidth={2.5} />
                      {daysLeft} days ({s.burnRatePerDay}/day)
                    </span>
                  ) : (
                    <span className="pill pill--ok">
                      <ShieldCheck size={12} strokeWidth={2.5} />
                      {daysLeft} days reserve
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: "12px" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.expiryDate}</div>
                    <div style={{ color: "var(--mute)", fontSize: "11px" }}>{s.batchLot}</div>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className={`btn-pill ${isCritical ? "" : "btn-pill--ghost"}`}
                    onClick={() => onRequest(s.name)}
                    style={{ minHeight: 32, padding: "4px 12px", fontSize: "12px", gap: 4 }}
                  >
                    <Plus size={13} strokeWidth={2.5} />
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
