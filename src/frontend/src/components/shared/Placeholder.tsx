export function Placeholder({ title }: { title: string }) {
  return (
    <section className="card">
      <h1 className="display" style={{ fontSize: 32, margin: "0 0 8px" }}>{title}</h1>
      <p className="muted" style={{ margin: 0 }}>This section arrives in Task 6. The shell — sign in, navigation, and data client — is live.</p>
    </section>
  );
}
