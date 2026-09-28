export function ReplyCard({ reply }: { reply: string }) {
  if (!reply) return null;
  return (
    <div className="card">
      <p style={{ margin: 0, maxWidth: "70ch" }}>{reply}</p>
    </div>
  );
}
