import type { Playbook } from "@/services/playbook/types";

export function PlaybooksCard({ books, ran, onRun }: { books: Playbook[]; ran: Set<number>; onRun: (id: number) => void }) {
  const list = books.slice(0, 3);
  return (
    <div className="card card--lift anim" style={{ "--i": 9 } as React.CSSProperties}>
      <h3>Run a playbook</h3>
      <p className="sub">{list.length === 0 ? "No playbooks yet." : "Start the response in one tap."}</p>
      {list.length > 0 && (
        <ul className="rows">
          {list.map((b) => (
            <li key={b.id}>
              <span className="glyph" aria-hidden>▸</span>
              <div className="meta"><p>{b.title}</p><small>{b.code}</small></div>
              <span className="tail">
                {ran.has(b.id)
                  ? <span className="pill pill--ok">Done</span>
                  : <button className="btn-pill" onClick={() => onRun(b.id)} style={{ minHeight: 34, padding: "6px 14px", fontSize: 13 }}>Run</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
