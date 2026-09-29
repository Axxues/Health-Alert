import { useState } from "react";
import { PackagePlus, Search } from "lucide-react";
import { StockpileCard } from "../components/StockpileCard";
import { SupplyTable, INITIAL_SUPPLIES, type MedicineItem } from "../components/SupplyTable";
import { RequisitionModal } from "../components/RequisitionModal";

export function Medicine() {
  const [supplies] = useState<MedicineItem[]>(INITIAL_SUPPLIES);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");

  const filtered = supplies.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.targetDisease.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
  );

  const lowStockCount = supplies.filter((s) => s.currentStock / Math.max(1, s.burnRatePerDay) <= 7).length;

  function handleRequest(item = "") {
    setSelectedItem(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RHU Stockpile Tracking Active
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Medicine & Medical Stockpile Logistics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Prepositioned epidemic therapeutics, rehydration supplies, and rapid diagnostics calibrated to surge forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRequest("")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <PackagePlus size={15} strokeWidth={2.2} />
            <span>Emergency PHO Requisition</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StockpileCard totalItems={supplies.length} lowStockCount={lowStockCount} />

      {/* Search & Inventory Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Prepositioned Outbreak Stockpile Inventory
            </h3>
            <p className="text-xs text-muted-foreground">
              Automated burn-rate calculations based on current admissions.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search medication, disease, code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-5">
          <SupplyTable supplies={filtered} onRequest={handleRequest} />
        </div>
      </div>

      <RequisitionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialItem={selectedItem}
      />
    </div>
  );
}
