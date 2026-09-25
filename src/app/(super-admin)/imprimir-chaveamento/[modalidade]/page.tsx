import { supabaseAdmin } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";

function formatHora(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function MatchCard({ jogo, grupoA, grupoB, isMataMata }: { jogo: any, grupoA?: string, grupoB?: string, isMataMata?: boolean }) {
  const aWins = jogo.finalizado && jogo.vencedor_id === jogo.time_a_id;
  const bWins = jogo.finalizado && jogo.vencedor_id === jogo.time_b_id;
  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "A definir";
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "A definir";
  const isFutebol = jogo.modalidade?.includes("Futebol");
  const showTime = !!jogo.data_hora;

  return (
    <div style={{ width: "100%", flexShrink: 0, background:"#fff", border:"2px solid #000", borderRadius:"8px", overflow:"hidden", marginBottom: "15px", pageBreakInside: "avoid" }}>
      {(showTime || jogo.local || jogo.finalizado) && (
        <div style={{ padding:"5px 10px", borderBottom:"1px solid #000", fontSize:"12px", color:"#000", display:"flex", gap:"15px", background: "#f0f0f0", fontWeight: "bold" }}>
          <span>#Jogo {jogo.ordem_na_fase || "?"}</span>
          {grupoA && <span>{grupoA}</span>}
          {showTime && <span>🕐 {formatHora(jogo.data_hora)}</span>}
          {jogo.local && <span>📍 {jogo.local}</span>}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderBottom:"1px solid #000" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", overflow:"hidden", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ fontWeight: aWins ? 800 : 600, fontSize:"14px", color: "#000" }}>{nomeA} {aWins && "🏆"}</span>
          </div>
        </div>
        <span style={{ fontWeight:800, fontSize:"16px", minWidth:"30px", textAlign:"center" }}>
          {jogo.finalizado ? (isFutebol ? jogo.gols_time_a ?? "—" : jogo.sets_vencidos_a ?? "—") : "—"}
        </span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", overflow:"hidden", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ fontWeight: bWins ? 800 : 600, fontSize:"14px", color: "#000" }}>{nomeB} {bWins && "🏆"}</span>
          </div>
        </div>
        <span style={{ fontWeight:800, fontSize:"16px", minWidth:"30px", textAlign:"center" }}>
          {jogo.finalizado ? (isFutebol ? jogo.gols_time_b ?? "—" : jogo.sets_vencidos_b ?? "—") : "—"}
        </span>
      </div>
    </div>
  );
}

function TabelaClassificacao({ classificacoes, modalidade }: { classificacoes: any[], modalidade: string }) {
  const isTenis = modalidade.includes("Tênis");
  const sorted = [...classificacoes].sort((a, b) => {
    if (isTenis) {
      if (b.vitorias !== a.vitorias) return (b.vitorias || 0) - (a.vitorias || 0);
      const sgA = a.gols_pro - a.gols_contra;
      const sgB = b.gols_pro - b.gols_contra;
      if (sgB !== sgA) return sgB - sgA;
      return b.gols_pro - a.gols_pro;
    }
    const ptA = a.vitorias * 3 + a.empates;
    const ptB = b.vitorias * 3 + b.empates;
    if (ptB !== ptA) return ptB - ptA;
    if (b.vitorias !== a.vitorias) return (b.vitorias || 0) - (a.vitorias || 0);
    const sgA = a.gols_pro - a.gols_contra;
    const sgB = b.gols_pro - b.gols_contra;
    if (sgB !== sgA) return sgB - sgA;
    return b.gols_pro - a.gols_pro;
  });

  const thStyle = { padding:"8px", textAlign:"center" as const, fontWeight:800, color:"#000", border: "1px solid #000", fontSize:"12px", background: "#f0f0f0" };
  const tdStyle = { padding:"8px", textAlign:"center" as const, fontSize:"14px", border: "1px solid #000", color: "#000", fontWeight: 600 };
  
  return (
    <table style={{ width:"100%", borderCollapse:"collapse", marginBottom: "20px" }}>
      <thead>
        <tr>
          <th style={{...thStyle, textAlign:"left", width: "40px"}}>#</th>
          <th style={{...thStyle, textAlign:"left"}}>Time</th>
          <th style={thStyle}>J</th>
          <th style={thStyle}>V</th>
          {!isTenis && <th style={thStyle}>E</th>}
          <th style={thStyle}>D</th>
          <th style={thStyle}>{isTenis ? "PM" : "GP"}</th>
          <th style={thStyle}>{isTenis ? "PS" : "GC"}</th>
          <th style={thStyle}>{isTenis ? "SP" : "SG"}</th>
          <th style={thStyle}>{isTenis ? "Pts" : "Pts"}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c: any, idx: number) => {
          const pts = c.vitorias * 3 + c.empates;
          const saldo = c.gols_pro - c.gols_contra;
          const nome = c.time?.nome_base || c.time?.nome_igreja || "—";
          return (
            <tr key={c.id}>
              <td style={{...tdStyle, textAlign:"left"}}>{idx+1}</td>
              <td style={{...tdStyle, textAlign:"left"}}>{nome}</td>
              <td style={tdStyle}>{c.jogos_disputados}</td>
              <td style={tdStyle}>{c.vitorias}</td>
              {!isTenis && <td style={tdStyle}>{c.empates}</td>}
              <td style={tdStyle}>{c.derrotas}</td>
              <td style={tdStyle}>{c.gols_pro}</td>
              <td style={tdStyle}>{c.gols_contra}</td>
              <td style={tdStyle}>{saldo > 0 ? `+${saldo}` : saldo}</td>
              <td style={tdStyle}>{isTenis ? c.vitorias : pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function ImprimirChaveamento(props: { params: Promise<{ modalidade: string }> }) {
  const params = await props.params;
  const modalidade = decodeURIComponent(params.modalidade);
  const sb = supabaseAdmin();
  
  const { data: camp } = await sb.from("campeonatos").select("id, nome").eq("status", "ativo").single();
  if (!camp) return <div>Nenhum campeonato ativo</div>;

  const { data: grupos } = await sb.from("grupos").select("*").eq("campeonato_id", camp.id).eq("modalidade", modalidade).order("nome");
  const { data: classificacoes } = await sb.from("classificacao").select("*, time:times(*)").eq("campeonato_id", camp.id);
  const { data: jogos } = await sb.from("games").select("*, time_a:times!games_time_a_id_fkey(*), time_b:times!games_time_b_id_fkey(*)").eq("campeonato_id", camp.id).eq("modalidade", modalidade).eq("fase", "Fase de Grupos").order("ordem_na_fase");

  if (!grupos) return <div>Sem dados</div>;

  return (
    <div style={{ background: "#f0f0f0", minHeight: "100vh" }}>
      <style>{`
        @media print {
          body { background: white; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          .print-page { width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
          .break-before { page-break-before: always; }
        }
        .print-page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: white;
          padding: 15mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-family: Arial, sans-serif;
        }
      `}</style>

      <div className="no-print" style={{ textAlign: "center", padding: "20px", background: "white", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h1 style={{ marginBottom: "20px" }}>Chaveamento - {modalidade}</h1>
        <PrintButton text="🖨️ Imprimir Chaveamento (A4)" />
      </div>

      <div className="print-page">
        <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", textTransform: "uppercase", borderBottom: "3px solid #000", paddingBottom: "10px" }}>
          CLASSIFICAÇÃO DOS GRUPOS - {modalidade.toUpperCase()}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {grupos.map((g: any) => (
            <div key={g.id} style={{ pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "10px", background: "#000", color: "#fff", padding: "8px 12px", borderRadius: "5px" }}>{g.nome}</h2>
              <TabelaClassificacao classificacoes={classificacoes?.filter((c:any) => c.grupo_id === g.id) || []} modalidade={modalidade} />
            </div>
          ))}
        </div>
      </div>

      <div className="print-page break-before">
        <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", textTransform: "uppercase", borderBottom: "3px solid #000", paddingBottom: "10px" }}>
          JOGOS DA FASE DE GRUPOS - {modalidade.toUpperCase()}
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {jogos?.map((j: any) => {
            const gA = classificacoes?.find((c: any) => c.time_id === j.time_a_id);
            const gB = classificacoes?.find((c: any) => c.time_id === j.time_b_id);
            const nomeGrpA = grupos.find((g: any) => g.id === gA?.grupo_id)?.nome;
            const nomeGrpB = grupos.find((g: any) => g.id === gB?.grupo_id)?.nome;
            return <MatchCard key={j.id} jogo={j} grupoA={nomeGrpA} grupoB={nomeGrpB} />;
          })}
        </div>
      </div>
    </div>
  );
}