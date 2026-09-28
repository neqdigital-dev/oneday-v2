import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import ChaveamentoClient from "./ChaveamentoClient";

export const dynamic = "force-dynamic";

async function getData(campeonatoId?: string) {
  const sb = supabaseAdmin();
  let campQuery = sb.from("campeonatos").select("*");
  if (campeonatoId) campQuery = campQuery.eq("id", parseInt(campeonatoId));
  else campQuery = campQuery.eq("status", "ativo");

  const { data: camp } = await campQuery.single();
  if (!camp) return null;

  const [{ data: jogos }, { data: grupos }, { data: classificacoes }] = await Promise.all([
    sb.from("games")
      .select("*, time_a:times!games_time_a_id_fkey(id, nome_igreja, nome_base, imagem_url, distrito), time_b:times!games_time_b_id_fkey(id, nome_igreja, nome_base, imagem_url, distrito)")
      .eq("campeonato_id", camp.id)
      .order("ordem_na_fase"),
    sb.from("grupos")
      .select("*")
      .eq("campeonato_id", camp.id)
      .order("modalidade")
      .order("nome"),
    sb.from("classificacao")
      .select("*, time:times(id, nome_igreja, nome_base, imagem_url, distrito)")
      .eq("campeonato_id", camp.id),
  ]);

  const modalidades = [...new Set((grupos || []).map((g: any) => g.modalidade))];
  const modOrder = ["Futebol Masculino", "Tênis de Mesa", "Vôlei Feminino", "Vôlei Masculino"];
  modalidades.sort((a, b) => {
    const idxA = modOrder.indexOf(a as string);
    const idxB = modOrder.indexOf(b as string);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a as string).localeCompare(b as string);
  });

  return { camp, jogos: jogos || [], grupos: grupos || [], classificacoes: classificacoes || [], modalidades };
}

export default async function ChaveamentoPage(props: { searchParams?: Promise<{ campeonato_id?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const campeonato_id = searchParams.campeonato_id;
  const data = await getData(campeonato_id);

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
              {campeonato_id && (
                <div style={{ marginBottom: "1rem" }}>
                  <a href="/super-admin/dashboard" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "var(--brand-blue)", textDecoration: "none", borderRadius: "0.5rem", fontWeight: 600 }}>
                    ← Voltar para o Painel Admin
                  </a>
                  <div style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#fef3c7", color: "#b45309", borderRadius: "0.5rem", fontWeight: 600, fontSize: "0.85rem", border: "1px solid #fde68a" }}>
                    ⚠️ Você está visualizando o arquivo de um campeonato antigo.
                  </div>
                </div>
              )}
              <div className="section-header" style={{ marginBottom: "2rem" }}>
                <h1 className="heading-lg">
                  Chaveamento — <span className="text-gradient">{data.camp.nome}</span>
                </h1>
              </div>
              <ChaveamentoClient
                campNome={data.camp.nome}
                modalidades={data.modalidades}
                jogos={data.jogos}
                grupos={data.grupos}
                classificacoes={data.classificacoes}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
