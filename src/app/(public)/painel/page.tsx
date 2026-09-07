import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import { formatDate, getPontosClassificacao, getSaldoGols } from "@/lib/utils";
import type { Grupo, Classificacao, Time } from "@/types";

async function getData() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return null;

  const { data: grupos } = await sb.from("grupos").select("*, times(*)").eq("campeonato_id", camp.id).order("nome");
  const { data: classificacoes } = await sb.from("classificacao").select("*, times(id, nome_igreja, imagem_url, nome_base)").eq("campeonato_id", camp.id);

  return { camp, grupos, classificacoes };
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
                    <span style={{ fontWeight: "600" }}>{c.times?.nome_base || c.times?.nome_igreja}</span>
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

export default async function PainelPage() {
  const data = await getData();

  const modalidades = data?.grupos
    ? [...new Set(data.grupos.map((g: any) => g.modalidade))]
    : [];

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container">
          {!data ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏆</div>
              <h2 className="heading-md">Nenhum campeonato ativo</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>O painel será exibido quando um campeonato for iniciado.</p>
            </div>
          ) : (
            <>
              <div className="section-header" style={{ marginBottom: "2rem" }}>
                <div>
                  <h1 className="heading-lg">
                    Painel — <span className="text-gradient">{data.camp.nome}</span>
                  </h1>
                  <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Classificação por modalidade e grupo</p>
                </div>
              </div>

              {modalidades.map((mod: any) => (
                <div key={mod} style={{ marginBottom: "3rem" }}>
                  <h2 className="heading-md" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {mod === "Futebol Masculino" ? "⚽" : mod === "Futebol Feminino" ? "🏃‍♀️" : "🏐"}
                    {mod}
                  </h2>
                  <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}>
                    {data.grupos?.filter((g: any) => g.modalidade === mod).map((grupo: any) => (
                      <ClassificacaoTable key={grupo.id} grupo={grupo} classificacoes={data.classificacoes || []} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
