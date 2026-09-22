import { supabaseAdmin } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

export default async function ImprimirSumulas({ params }: { params: Promise<{ modalidade: string }> }) {
  const { modalidade: modParam } = await params;
  const modalidade = decodeURIComponent(modParam);
  
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id, nome").eq("status", "ativo").single();
  
  if (!camp) return <div>Sem campeonato ativo</div>;

  const { data: jogos } = await sb.from("games")
    .select("*, time_a:times!games_time_a_id_fkey(nome_base, nome_igreja), time_b:times!games_time_b_id_fkey(nome_base, nome_igreja)")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .order("ordem_na_fase");

  if (!jogos || jogos.length === 0) return <div>Nenhum jogo encontrado para {modalidade}.</div>;

  return (
    <div style={{ padding: "20px", background: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @media print {
          body { background: white; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          .sumula-page { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; page-break-after: always; }
        }
        .sumula-page {
            background: white; 
            width: 100%; 
            max-width: 800px;
            margin: 0 auto 40px auto; 
            padding: 20px; 
            border: 1px solid #ccc; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
        }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .teams { display: flex; justify-content: space-around; align-items: center; margin-bottom: 30px; font-weight: bold; font-size: 20px;}
        .team { width: 40%; text-align: center; }
        .score-box { border: 2px solid #000; width: 60px; height: 60px; display: inline-block; margin-top: 10px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
        .signature { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
      `}</style>

      <div className="no-print" style={{ textAlign: "center", marginBottom: "20px" }}>
        <PrintButton text="🖨️ Imprimir Todas as Súmulas" />
      </div>

      {jogos.map((game: any) => (
        <div key={game.id} className="sumula-page">
          <div className="header">
            <h1 style={{ margin: 0, fontSize: "24px" }}>Súmula de Jogo - {camp.nome}</h1>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#555" }}>
              {modalidade} - {game.fase} - Jogo #{game.ordem_na_fase}
            </p>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "16px" }}>
            <div><strong>Data/Hora:</strong> {game.data_hora ? formatDateTime(game.data_hora) : "A definir"}</div>
            <div><strong>Local:</strong> {game.local || "Sequência Única"}</div>
          </div>

          <div className="teams">
            <div className="team">
              <div>{game.time_a?.nome_base || game.time_a?.nome_igreja || "A definir"}</div>
              <div className="score-box"></div>
            </div>
            <div style={{ fontSize: "16px", color: "#777" }}>X</div>
            <div className="team">
              <div>{game.time_b?.nome_base || game.time_b?.nome_igreja || "A definir"}</div>
              <div className="score-box"></div>
            </div>
          </div>
          
          <div style={{ minHeight: "200px", border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
            <strong>Observações / Cartões / Penalidades:</strong>
          </div>

          <div className="signatures">
            <div className="signature">Assinatura Árbitro</div>
            <div className="signature">Assinatura Mesário / Anotador</div>
          </div>
        </div>
      ))}
    </div>
  );
}
