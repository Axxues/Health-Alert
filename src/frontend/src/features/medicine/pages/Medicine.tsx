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
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="live-badge">
              <span className="dot dot--pulse" />
              RHU Stockpile Tracking Active
            </span>
          </div>
          <h1>Medicine & Medical Stockpile Logistics</h1>
          <p className="sub">
            Prepositioned epidemic therapeutics, rehydration supplies, and rapid diagnostics calibrated to disease surge forecasts.
          </p>
        </div>

        <div className="dash-actions">
          <button className="btn-pill" onClick={() => handleRequest("")}>
            <PackagePlus size={16} strokeWidth={2.2} />
            <span>Emergency PHO Requisition</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <StockpileCard totalItems={supplies.length} lowStockCount={lowStockCount} />

      {/* Search & Inventory Table */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Prepositioned Outbreak Stockpile Inventory</h3>
            <p className="sub">Automated burn-rate calculations based on current hospital admissions.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 320 }}>
            <label className="search" style={{ width: "100%", background: "var(--card-subtle)" }}>
              <Search size={15} strokeWidth={2.2} style={{ color: "var(--mute)" }} />
              <input
                placeholder="Search medication, disease, code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
        </div>

        <SupplyTable supplies={filtered} onRequest={handleRequest} />
      </div>

      <RequisitionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialItem={selectedItem}
      />
    </div>
  );
}
