import { useEffect, useState } from "react";
import { listFeeds } from "@/services/surveillance/api/surveillance.api";
import type { SurveillanceFeed } from "@/services/surveillance";
import { FeedTable } from "../components/FeedTable";

export function SurveillancePage() {
  const [feeds, setFeeds] = useState<SurveillanceFeed[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listFeeds().then(setFeeds).catch(() => setError("Could not load feeds. Try again."));
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Feeds feeding the outlook</h1>
      <div className="card">
        {error ? <p style={{ color: "var(--ruby)", margin: 0 }}>{error}</p> : <FeedTable feeds={feeds} />}
      </div>
    </div>
  );
}
