import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { TrendingUp, Workflow, AlertCircle, ArrowRight } from "lucide-react";
import { getOutlook, runForecast } from "@/services/forecast/api";
import type { ForecastOutlook } from "@/services/forecast/types";
import { OutlookCard } from "../components/OutlookCard";
import { ForecastToolbar, DISEASES } from "../components/ForecastToolbar";

export function Forecast() {
  const [disease, setDisease] = useState("dengue");
  const [outlook, setOutlook] = useState<ForecastOutlook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setOutlook(await getOutlook({ disease }));
    } catch {
      setError("Unable to retrieve outlook for this disease. Please check connection.");
    }
  }, [disease]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRun() {
    setLoading(true);
    setError("");
    try {
      setOutlook(await runForecast({ disease }));
    } catch {
      setError("Forecast simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedDiseaseObj = DISEASES.find((d) => d.id === disease);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <TrendingUp size={13} strokeWidth={2.2} />
              Bi-LSTM & ARGO Predictive Engine
            </span>
          </div>
          <h1>Multi-Syndromic Outbreak Trajectory</h1>
          <p className="sub">
            2 to 4-week early warning forecasts integrating weather covariates, syndromic lags, and clinical EDCS data.
          </p>
        </div>

        <div className="dash-actions">
          <Link
            className="btn-pill btn-pill--ghost"
            to="/playbooks"
            style={{ textDecoration: "none" }}
          >
            <Workflow size={16} strokeWidth={2.2} />
            <span>Launch {selectedDiseaseObj?.label || "Disease"} Playbook</span>
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Disease Selection & Controls */}
      <ForecastToolbar
        disease={disease}
        onChange={setDisease}
        onRun={onRun}
        loading={loading}
      />

      {error ? (
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--red-bg)",
            borderColor: "var(--red-border)",
            color: "var(--red)",
          }}
        >
          <AlertCircle size={20} strokeWidth={2.2} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{error}</p>
        </div>
      ) : (
        <OutlookCard outlook={outlook} />
      )}
    </div>
  );
}
