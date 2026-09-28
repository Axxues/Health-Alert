import { Link } from "react-router";
import type { HealthAlert } from "@/services/alerts/types";

export function AlertsCard({ alerts, onAck }: { alerts: HealthAlert[]; onAck: (id: number) => void }) {
  const open = alerts.filter((a) => a.status !== "acked").slice(0, 3);
  return (
    <div className="card card--lift anim" style={{ "--i": 8 } as React.CSSProperties}>
      <h3>Alerts waiting</h3>
      <p className="sub">{open.length === 0 ? "All caught up." : `${open.length} need${open.length === 1 ? "s" : ""} a response.`}</p>
      {open.length > 0 && (
        <ul className="rows">
          {open.map((a) => (
            <li key={a.id}>
              <span className="glyph" aria-hidden>!</span>
              <div className="meta"><p>{a.message}</p></div>
              <span className="tail">
                <button className="btn-pill" onClick={() => onAck(a.id)} style={{ minHeight: 34, padding: "6px 14px", fontSize: 13 }}>Ack</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/alerts" style={{ display: "inline-block", marginTop: 12, fontSize: 14 }}>Review all →</Link>
    </div>
  );
}
