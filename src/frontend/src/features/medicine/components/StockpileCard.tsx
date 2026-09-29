import { Pill, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export function StockpileCard({
  totalItems,
  lowStockCount,
}: {
  totalItems: number;
  lowStockCount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Stockpile SKUs */}
      <div className="rounded-xl border border-border border-l-4 border-l-blue-500 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Active Stockpile SKUs</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Pill size={16} strokeWidth={2.2} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
          {totalItems}
        </p>
        <div className="mt-1 text-xs text-muted-foreground">
          Targeted Outbreak Formulations
        </div>
      </div>

      {/* Critical Stock Warnings */}
      <div className="rounded-xl border border-border border-l-4 border-l-rose-500 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Critical Stock Warnings</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle size={16} strokeWidth={2.2} />
          </div>
        </div>
        <p className={`mt-2 text-2xl font-bold tracking-tight font-mono ${lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
          {lowStockCount}
        </p>
        <div className="mt-1 text-xs text-muted-foreground">
          &lt; 5 days estimated reserve
        </div>
      </div>

      {/* Cold-Chain & Expiry Health */}
      <div className="rounded-xl border border-border border-l-4 border-l-emerald-500 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Cold-Chain & Expiry</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={16} strokeWidth={2.2} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
          98.4<span className="text-base font-normal text-muted-foreground">%</span>
        </p>
        <div className="mt-1 text-xs text-muted-foreground">
          All batches within validity
        </div>
      </div>

      {/* Next Delivery Window */}
      <div className="rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Next Delivery Window</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock size={16} strokeWidth={2.2} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
          3<span className="text-base font-normal text-muted-foreground"> days</span>
        </p>
        <div className="mt-1 text-xs text-muted-foreground">
          Provincial Logistics Route A
        </div>
      </div>
    </div>
  );
}
