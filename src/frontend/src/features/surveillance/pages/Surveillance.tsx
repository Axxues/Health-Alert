import { useEffect, useState } from "react";
import { Radio, Database, Activity, Zap, AlertCircle } from "lucide-react";
import { listFeeds } from "@/services/surveillance/api";
import type { SurveillanceFeed } from "@/services/surveillance/types";
import { FeedTable } from "../components/FeedTable";

export function Surveillance() {
  const [feeds, setFeeds] = useState<SurveillanceFeed[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listFeeds().then(setFeeds).catch(() => setError("Could not load surveillance feeds. Try again."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="live-badge">
              <span className="dot dot--pulse" />
              Automated Data Pipeline Active
            </span>
          </div>
          <h1>Multi-Syndromic Surveillance Feeds</h1>
          <p className="sub">
            Continuous ingestion streams feeding predictive epidemiological models and LGU early warning triggers.
          </p>
        </div>
      </div>

      {/* Surveillance Feed Telemetry Metrics */}
      <div className="stats">
        <div className="stat stat--hero">
          <div className="lbl">
            <span>24h Ingested Records</span>
            <Database size={18} strokeWidth={2.2} />
          </div>
          <p className="num tabular">14,820</p>
          <div className="trend">
            <span>EDCS-IS, PAGASA, & Clinics</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Active Pipelines</span>
            <Radio size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          </div>
          <p className="num tabular">{feeds.length || 10}</p>
          <div className="trend">
            <span>100% Ingestion Uptime</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Pipeline Ingest Latency</span>
            <Zap size={18} strokeWidth={2.2} style={{ color: "var(--amber)" }} />
          </div>
          <p className="num tabular">380<span style={{ fontSize: 20 }}>ms</span></p>
          <div className="trend">
            <span>Sub-second streaming</span>
          </div>
        </div>

        <div className="stat card--lift">
          <div className="lbl">
            <span>Syndromic Anomaly Spikes</span>
            <Activity size={18} strokeWidth={2.2} style={{ color: "var(--red)" }} />
          </div>
          <p className="num tabular">2</p>
          <div className="trend">
            <span>Flagged for review</span>
          </div>
        </div>
      </div>

      {/* Main Feed Card */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Configured Ingest Pipelines</h3>
            <p className="sub">Synchronized with DOH RA 11332 mandatory reporting standards.</p>
          </div>
          <span className="pill pill--primary">
            {feeds.length} Verified Sources
          </span>
        </div>

        {error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "var(--red-bg)",
              borderRadius: "var(--radius-md)",
              color: "var(--red)",
            }}
          >
            <AlertCircle size={18} strokeWidth={2.2} />
            <span>{error}</span>
          </div>
        ) : (
          <FeedTable feeds={feeds} />
        )}
      </div>
    </div>
  );
}
