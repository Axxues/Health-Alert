export interface Bar { label: string; value: number; kind: "solid" | "mint" | "hatch"; tag?: string }

// Values drive height; hatch marks projected counts, never confirmed ones.
export function WeekBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="bars" role="img" aria-label="Risk by place">
      {bars.map((b, i) => (
        <div className="barcol" key={b.label}>
          {b.tag && <span className="barval">{b.tag}</span>}
          <div
            className={`bar bar--${b.kind}`}
            style={{ height: `${Math.max(8, Math.round((b.value / max) * 120))}px`, "--i": i } as React.CSSProperties}
          />
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
}
