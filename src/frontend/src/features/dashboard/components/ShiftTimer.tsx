import { useEffect, useRef, useState } from "react";

function fmt(s: number) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

export function ShiftTimer() {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const acc = useRef(0);
  const t0 = useRef(Date.now());

  useEffect(() => {
    if (!running) return;
    t0.current = Date.now();
    const id = setInterval(() => setSecs(acc.current + (Date.now() - t0.current) / 1000), 250);
    return () => clearInterval(id);
  }, [running]);

  const pause = () => { acc.current = secs; setRunning(false); };
  const resume = () => setRunning(true);
  const stop = () => { acc.current = secs; setRunning(false); setDone(true); };
  const reset = () => { acc.current = 0; setSecs(0); setDone(false); setRunning(true); };

  return (
    <div className="card tracker anim" style={{ "--i": 7 } as React.CSSProperties}>
      <h3 style={{ color: "#fff" }}>Shift timer</h3>
      <p className="clock tabular">{fmt(secs)}</p>
      <div style={{ display: "flex", gap: 10 }}>
        {running
          ? <button className="tbtn" onClick={pause} aria-label="Pause">❚❚</button>
          : <button className="tbtn" onClick={resume} aria-label="Resume">▶</button>}
        {!done
          ? <button className="tbtn tbtn--stop" onClick={stop} aria-label="End shift">■</button>
          : <button className="tbtn" onClick={reset} aria-label="Restart">↺</button>}
      </div>
      <p className="sub" style={{ color: "#cde9d8", marginTop: 12 }}>
        {done ? "Shift ended. Timer kept for the log." : running ? "On shift now." : "Paused."}
      </p>
    </div>
  );
}
