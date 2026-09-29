import { Pill, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export function StockpileCard({
  totalItems,
  lowStockCount,
}: {
  totalItems: number;
  lowStockCount: number;
}) {
  return (
    <div className="stats">
      <div className="stat stat--hero">
        <div className="lbl">
          <span>Active Stockpile SKUs</span>
          <Pill size={18} strokeWidth={2.2} />
        </div>
        <p className="num tabular">{totalItems}</p>
        <div className="trend">
          <span>Targeted Outbreak Formulations</span>
        </div>
      </div>

      <div className="stat card--lift">
        <div className="lbl">
          <span>Critical Stock Warnings</span>
          <AlertTriangle size={18} strokeWidth={2.2} style={{ color: "var(--red)" }} />
        </div>
        <p className="num tabular" style={{ color: lowStockCount > 0 ? "var(--red)" : "var(--ink)" }}>
          {lowStockCount}
        </p>
        <div className="trend">
          <span>&lt; 5 days estimated reserve</span>
        </div>
      </div>

      <div className="stat card--lift">
        <div className="lbl">
          <span>Cold-Chain & Expiry Health</span>
          <ShieldCheck size={18} strokeWidth={2.2} style={{ color: "var(--green)" }} />
        </div>
        <p className="num tabular">98.4<span style={{ fontSize: 20 }}>%</span></p>
        <div className="trend">
          <span>All batches within validity</span>
        </div>
      </div>

      <div className="stat card--lift">
        <div className="lbl">
          <span>Next Delivery Window</span>
          <Clock size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
        </div>
        <p className="num tabular">3<span style={{ fontSize: 20 }}>d</span></p>
        <div className="trend">
          <span>Provincial Logistics Route A</span>
        </div>
      </div>
    </div>
  );
}
