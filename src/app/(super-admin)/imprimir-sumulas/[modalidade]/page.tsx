import { supabaseAdmin } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";
import SumulaVolei from "@/components/SumulaVolei";
import SumulaFutebol from "@/components/SumulaFutebol";

export default async function ImprimirSumulas(props: { params: Promise<{ modalidade: string }>; searchParams: Promise<{ fase?: string }> }) {
  const { modalidade: modParam } = await props.params;
  const searchParams = await props.searchParams;
  const modalidade = decodeURIComponent(modParam);
  const selectedFase = searchParams.fase || "Fase de Grupos";
  
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id, nome").eq("status", "ativo").single();
  
  if (!camp) return <div>Sem campeonato ativo</div>;

  // Buscar fases disponíveis
  const { data: todasFases } = await sb.from("games")
    .select("fase")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade);
    
  let fasesUnicas = Array.from(new Set((todasFases || []).map((j: any) => j.fase))).filter(Boolean);
  if (!fasesUnicas.includes("Fase de Grupos")) fasesUnicas.unshift("Fase de Grupos");

  const order = ["Fase de Grupos", "Quartas de Final", "Semifinal", "Final"];
  fasesUnicas.sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const { data: jogos } = await sb.from("games")
    .select("*, time_a:times!games_time_a_id_fkey(*), time_b:times!games_time_b_id_fkey(*)")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .eq("fase", selectedFase)
    .order("ordem_na_fase");

  if (!jogos || jogos.length === 0) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      Nenhum jogo encontrado para {modalidade} na fase {selectedFase}.
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
        {fasesUnicas.map(f => (
          <a key={f} href={`?fase=${f}`} style={{ padding: "5px 10px", background: selectedFase === f ? "var(--brand-500, #3b82f6)" : "#e5e7eb", color: selectedFase === f ? "#fff" : "#374151", textDecoration: "none", borderRadius: "5px", fontWeight: "bold" }}>
            {f}
          </a>
        ))}
      </div>
    </div>
  );

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
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          {fasesUnicas.map((f: string) => (
            <a key={f} href={`?fase=${f}`} style={{ padding: "5px 15px", background: selectedFase === f ? "var(--brand-500, #3b82f6)" : "#e5e7eb", color: selectedFase === f ? "#fff" : "#374151", textDecoration: "none", borderRadius: "5px", fontWeight: "bold" }}>
              {f}
            </a>
          ))}
        </div>
        <PrintButton text={`🖨️ Imprimir Súmulas (${selectedFase})`} />
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
