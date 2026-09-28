const DISEASES = ["dengue", "leptospirosis", "ili", "asthma"] as const;

export function ForecastToolbar({
  disease,
  onChange,
  onRun,
}: {
  disease: string;
  onChange: (d: string) => void;
  onRun: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select className="input" value={disease} onChange={(e) => onChange(e.target.value)} aria-label="Disease">
        {DISEASES.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <button className="btn-pill" onClick={onRun}>Refresh outlook</button>
    </div>
  );
}
