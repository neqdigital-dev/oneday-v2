import { supabaseAdmin } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";
import SumulaVolei from "@/components/SumulaVolei";
import SumulaFutebol from "@/components/SumulaFutebol";

export default async function ImprimirSumulas({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade: modParam } = await params;
  const modalidade = decodeURIComponent(modParam);
  
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id, nome").eq("status", "ativo").single();
  
  if (!camp) return <div>Sem campeonato ativo</div>;

  const { data: jogos } = await sb.from("games")
    .select("*, time_a:times!games_time_a_id_fkey(*), time_b:times!games_time_b_id_fkey(*)")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .order("ordem_na_fase");

  if (!jogos || jogos.length === 0) return <div style={{ padding: "40px", textAlign: "center" }}>Nenhum jogo encontrado para {modalidade}.</div>;

  // Se for futebol/futsal, precisamos buscar os jogadores de cada time
  const isFutebol = modalidade.toLowerCase().includes("futebol") || modalidade.toLowerCase().includes("futsal");
  let jogadoresPorTime: Record<string, any[]> = {};

  if (isFutebol) {
    const timeIds = new Set<string>();
    jogos.forEach((j: any) => {
      if (j.time_a_id) timeIds.add(j.time_a_id);
      if (j.time_b_id) timeIds.add(j.time_b_id);
    });

    const { data: jogadores } = await sb
      .from("jogadores")
      .select("*")
      .in("time_id", Array.from(timeIds));

    if (jogadores) {
      jogadores.forEach((j: any) => {
        if (!jogadoresPorTime[j.time_id]) jogadoresPorTime[j.time_id] = [];
        jogadoresPorTime[j.time_id].push(j);
      });
    }
  }

  return (
    <div style={{ background: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @media print {
          body { background: white; padding: 0; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ textAlign: "center", padding: "20px", background: "white", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h1 style={{ marginBottom: "20px" }}>Súmulas - {modalidade}</h1>
        <PrintButton text="🖨️ Imprimir Todas as Súmulas" />
      </div>

      {jogos.map((game: any) => {
        if (isFutebol) {
          return (
            <SumulaFutebol 
              key={game.id} 
              game={game} 
              modalidade={modalidade} 
              nomeCampeonato={camp.nome} 
              jogadoresA={jogadoresPorTime[game.time_a_id] || []}
              jogadoresB={jogadoresPorTime[game.time_b_id] || []}
            />
          );
        } else {
          return (
            <SumulaVolei 
              key={game.id} 
              game={game} 
              modalidade={modalidade} 
              nomeCampeonato={camp.nome} 
            />
          );
        }
      })}
    </div>
  );
}
