import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { getOutlook, runForecast } from "@/services/forecast/api";
import type { ForecastOutlook } from "@/services/forecast/types";
import { OutlookCard } from "../components/OutlookCard";

export function Forecast() {
  const [disease, setDisease] = useState("dengue");
  const [outlook, setOutlook] = useState<ForecastOutlook | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setOutlook(await getOutlook({ disease }));
    } catch {
      setError("Could not load the outlook. Try again.");
    }
  }, [disease]);

  useEffect(() => { void load(); }, [load]);

  async function onRun() {
    try {
      setOutlook(await runForecast({ disease }));
    } catch {
      setError("Run failed. Try again.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0, maxWidth: "24ch" }}>What to expect this week</h1>
      <ForecastToolbar disease={disease} onChange={setDisease} onRun={onRun} />
      {error ? <p style={{ color: "var(--ruby)", margin: 0 }}>{error}</p> : <OutlookCard outlook={outlook} />}
      <Link to="/playbooks" style={{ justifySelf: "start" }}>Open the playbook for {disease} →</Link>
    </div>
  );
}
