import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import PainelClient from "./PainelClient";

async function getData() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return null;

  const { data: grupos } = await sb.from("grupos").select("*, times(*)").eq("campeonato_id", camp.id).order("nome");
  const { data: classificacoes } = await sb.from("classificacao").select("*, times(id, nome_igreja, imagem_url, nome_base)").eq("campeonato_id", camp.id);

  return { camp, grupos, classificacoes };
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
            <PainelClient 
              campNome={data.camp.nome} 
              modalidades={modalidades as string[]} 
              grupos={data.grupos || []} 
              classificacoes={data.classificacoes || []} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
