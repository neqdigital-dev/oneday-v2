"use client";
import { useState } from "react";
import { getPontosClassificacao, getSaldoGols } from "@/lib/utils";

function getModalidadeIcon(mod: string) {
  if (mod.includes("Futebol")) return mod.includes("Feminino") ? "🏃‍♀️" : "⚽";
  if (mod.includes("Vôlei")) return "🏐";
  if (mod.includes("Tênis")) return "🏓";
  return "🏅";
}

function ClassificacaoTable({ grupo, classificacoes }: { grupo: any; classificacoes: any[] }) {
  const cls = classificacoes
    .filter((c: any) => c.grupo_id === grupo.id)
    .sort((a: any, b: any) => {
      const ptA = getPontosClassificacao(a.vitorias, a.empates);
      const ptB = getPontosClassificacao(b.vitorias, b.empates);
      if (ptB !== ptA) return ptB - ptA;
      return getSaldoGols(b.gols_pro, b.gols_contra) - getSaldoGols(a.gols_pro, a.gols_contra);
    });

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontWeight: "700", fontSize: "1rem" }}>{grupo.nome}</span>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>({grupo.times?.length || 0} times)</span>
      </div>
      <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GF</th><th>GC</th><th>SG</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {cls.map((c: any, idx: number) => (
              <tr key={c.id}>
                <td style={{ color: "var(--text-muted)", fontWeight: "600" }}>{idx + 1}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    {c.times?.imagem_url && <img src={c.times.imagem_url} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "600" }}>{c.times?.nome_base || c.times?.nome_igreja}</span>
                      {c.times?.distrito && (
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.times.distrito}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>{c.jogos_disputados}</td>
                <td style={{ color: "var(--green-400)" }}>{c.vitorias}</td>
                <td style={{ color: "var(--gold-400)" }}>{c.empates}</td>
                <td style={{ color: "var(--red-400)" }}>{c.derrotas}</td>
                <td>{c.gols_pro}</td>
                <td>{c.gols_contra}</td>
                <td style={{ color: c.gols_pro >= c.gols_contra ? "var(--green-400)" : "var(--red-400)" }}>{getSaldoGols(c.gols_pro, c.gols_contra)}</td>
                <td style={{ fontWeight: "800", fontSize: "1rem", color: "var(--brand-400)" }}>{getPontosClassificacao(c.vitorias, c.empates)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PainelClient({ campNome, modalidades, grupos, classificacoes }: {
  campNome: string;
  modalidades: string[];
  grupos: any[];
  classificacoes: any[];
}) {
  const [activeTab, setActiveTab] = useState(modalidades[0] || "");
  const gruposDoModal = grupos.filter((g: any) => g.modalidade === activeTab).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  return (
    <>
      <div className="section-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="heading-lg">
            Painel — <span className="text-gradient">{campNome}</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Classificação por modalidade e grupo</p>
        </div>
      </div>

      {modalidades.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:"0.5rem", marginBottom:"2rem", padding:"0.375rem", background:"var(--glass-bg,#f9fafb)", borderRadius:"0.75rem", border:"1px solid var(--glass-border,#e5e7eb)" }}>
          {modalidades.map((mod: string) => (
            <button key={mod} onClick={() => setActiveTab(mod)} style={{
              padding:"0.625rem 0.5rem", borderRadius:"0.5rem", border:"none", cursor:"pointer", fontSize:"0.8125rem",
              fontWeight: activeTab === mod ? 700 : 500,
              background: activeTab === mod ? "var(--primary,#2563eb)" : "transparent",
              color: activeTab === mod ? "#fff" : "var(--text-secondary,#6b7280)",
              transition:"all 0.2s ease", whiteSpace:"nowrap", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.375rem"
            }}>
              {getModalidadeIcon(mod)} {mod}
            </button>
          ))}
        </div>
      )}

      {gruposDoModal.length > 0 ? (
        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
          {gruposDoModal.map((grupo: any) => (
            <ClassificacaoTable key={grupo.id} grupo={grupo} classificacoes={classificacoes} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--text-muted,#9ca3af)" }}>
          <p>Nenhum grupo cadastrado para {activeTab}.</p>
        </div>
      )}
    </>
  );
}
