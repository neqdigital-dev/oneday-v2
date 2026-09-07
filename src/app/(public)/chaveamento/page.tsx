import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";

async function getData() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return null;

  const { data: jogos } = await sb.from("games")
    .select("*, time_a:times!games_time_a_id_fkey(id, nome_igreja, nome_base, imagem_url), time_b:times!games_time_b_id_fkey(id, nome_igreja, nome_base, imagem_url), vencedor:times!games_vencedor_id_fkey(id, nome_base, nome_igreja)")
    .eq("campeonato_id", camp.id)
    .order("ordem_na_fase");

  return { camp, jogos };
}

function MatchCard({ jogo }: { jogo: any }) {
  const aWins = jogo.vencedor_id === jogo.time_a_id;
  const bWins = jogo.vencedor_id === jogo.time_b_id;
  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "A definir";
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "A definir";

  return (
    <div className="card" style={{ marginBottom: "0.75rem", overflow: "hidden" }}>
      {jogo.data_hora && (
        <div style={{ padding: "0.375rem 0.875rem", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--glass-border)", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "1rem" }}>
          <span>🕐 {formatDateTime(jogo.data_hora)}</span>
          {jogo.local && <span>📍 {jogo.local}</span>}
        </div>
      )}
      <div className="bracket-team" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {jogo.time_a?.imagem_url && <img src={jogo.time_a.imagem_url} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />}
          <span style={{ fontWeight: aWins ? "700" : "500", color: aWins ? "var(--gold-400)" : "inherit" }}>{nomeA}</span>
          {aWins && <span>🏆</span>}
        </div>
        <span className={`bracket-score ${aWins ? "winner-score" : ""}`}>
          {jogo.finalizado ? (jogo.modalidade?.includes("Futebol") ? jogo.gols_time_a ?? "—" : jogo.sets_vencidos_a ?? "—") : "—"}
        </span>
      </div>
      <div className="bracket-team">
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {jogo.time_b?.imagem_url && <img src={jogo.time_b.imagem_url} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />}
          <span style={{ fontWeight: bWins ? "700" : "500", color: bWins ? "var(--gold-400)" : "inherit" }}>{nomeB}</span>
          {bWins && <span>🏆</span>}
        </div>
        <span className={`bracket-score ${bWins ? "winner-score" : ""}`}>
          {jogo.finalizado ? (jogo.modalidade?.includes("Futebol") ? jogo.gols_time_b ?? "—" : jogo.sets_vencidos_b ?? "—") : "—"}
        </span>
      </div>
    </div>
  );
}

export default async function ChaveamentoPage() {
  const data = await getData();

  const modalidades = data?.jogos
    ? [...new Set(data.jogos.map((j: any) => j.modalidade))]
    : [];

  const fasesByModal = (modal: string) => {
    const jogosModal = data?.jogos?.filter((j: any) => j.modalidade === modal) || [];
    const fases = [...new Set(jogosModal.map((j: any) => j.fase))];
    return fases.map(fase => ({
      fase,
      jogos: jogosModal.filter((j: any) => j.fase === fase),
    }));
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container">
          {!data ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎯</div>
              <h2 className="heading-md">Chaveamento não gerado</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>O chaveamento será exibido após ser gerado pelo administrador.</p>
            </div>
          ) : (
            <>
              <div className="section-header" style={{ marginBottom: "2rem" }}>
                <h1 className="heading-lg">
                  Chaveamento — <span className="text-gradient">{data.camp.nome}</span>
                </h1>
              </div>

              {modalidades.map((mod: any) => (
                <div key={mod} style={{ marginBottom: "3rem" }}>
                  <h2 className="heading-md" style={{ marginBottom: "1.5rem" }}>
                    {mod === "Futebol Masculino" ? "⚽" : mod === "Futebol Feminino" ? "🏃‍♀️" : "🏐"} {mod}
                  </h2>
                  {fasesByModal(mod).map(({ fase, jogos }) => (
                    <div key={fase} style={{ marginBottom: "2rem" }}>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "1rem" }}>{fase}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                        {jogos.map((jogo: any) => (
                          <MatchCard key={jogo.id} jogo={jogo} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
