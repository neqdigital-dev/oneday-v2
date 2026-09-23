import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import PodioClient from "./PodioClient";

async function getData() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return null;

  const { data: jogos } = await sb.from("jogos").select("*, time_a:time_a_id(*), time_b:time_b_id(*)").eq("campeonato_id", camp.id).neq("fase", "Fase de Grupos");
  
  return { camp, jogos };
}

export default async function PodioPage() {
  const data = await getData();

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container">
          {!data ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏆</div>
              <h2 className="heading-md">Nenhum campeonato ativo</h2>
            </div>
          ) : (
            <PodioClient campNome={data.camp.nome} jogos={data.jogos || []} />
          )}
        </div>
      </main>
    </div>
  );
}
