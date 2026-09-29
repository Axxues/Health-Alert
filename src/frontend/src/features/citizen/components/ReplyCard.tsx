import { HeartPulse, PhoneCall, Building2 } from "lucide-react";

export function ReplyCard({ reply }: { reply: string }) {
  if (!reply) return null;

  const isEmergency = /ospital|emergency|danger|delikado|agad/i.test(reply);

  return (
    <div
      className="card anim"
      style={{
        borderLeft: `4px solid ${isEmergency ? "var(--red)" : "var(--primary)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          className="glyph"
          style={{
            background: isEmergency ? "var(--red-bg)" : "var(--primary-light)",
            color: isEmergency ? "var(--red)" : "var(--primary)",
          }}
        >
          <HeartPulse size={18} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
            Rekomendasyon ng Serbisyong Pangkalusugan (Health Guidance)
          </div>
          <div style={{ fontSize: "12px", color: "var(--mute)" }}>
            Bilingual Triage Protocol · DOH & Municipal Health Office
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: "15px",
          lineHeight: 1.65,
          color: "var(--ink)",
          padding: "16px 20px",
          background: "var(--card-subtle)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--hairline)",
          margin: "12px 0 16px",
        }}
      >
        {reply}
      </div>

      {/* Emergency Guidance Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 16px",
          background: "var(--backdrop)",
          borderRadius: "var(--radius-md)",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
          <Building2 size={16} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          <span>Libreng konsulta at gamot sa inyong pinakamalapit na <b>Barangay Health Station / RHU</b></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--red)" }}>
          <PhoneCall size={14} strokeWidth={2.2} />
          <span>Emergency Hotline: 911 / DOH 1555</span>
        </div>
      </div>
    </div>
  );
}
