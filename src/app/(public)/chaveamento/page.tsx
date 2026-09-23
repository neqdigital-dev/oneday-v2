import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import ChaveamentoClient from "./ChaveamentoClient";

export const dynamic = "force-dynamic";

async function getData() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return null;

  const [{ data: jogos }, { data: grupos }, { data: classificacoes }] = await Promise.all([
    sb.from("games")
      .select("*, time_a:times!games_time_a_id_fkey(id, nome_igreja, nome_base, imagem_url), time_b:times!games_time_b_id_fkey(id, nome_igreja, nome_base, imagem_url)")
      .eq("campeonato_id", camp.id)
      .order("ordem_na_fase"),
    sb.from("grupos")
      .select("*")
      .eq("campeonato_id", camp.id)
      .order("modalidade")
      .order("nome"),
    sb.from("classificacao")
      .select("*, time:times(id, nome_igreja, nome_base, imagem_url)")
      .eq("campeonato_id", camp.id),
  ]);

  const modalidades = [...new Set((grupos || []).map((g: any) => g.modalidade))];

  return { camp, jogos: jogos || [], grupos: grupos || [], classificacoes: classificacoes || [], modalidades };
}

export default async function ChaveamentoPage() {
  const data = await getData();

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
