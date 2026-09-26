import { supabaseAdmin } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";

function formatHora(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function MatchCard({ jogo, grupoA, grupoB }: { jogo: any, grupoA?: string, grupoB?: string }) {
  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "A definir";
  const distritoA = jogo.time_a?.distrito || null;
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "A definir";
  const distritoB = jogo.time_b?.distrito || null;
  const showTime = !!jogo.data_hora;

  return (
    <div style={{ width: "100%", background:"#fff", border:"1px solid #e5e7eb", borderRadius:"0.75rem", overflow:"hidden", marginBottom: "0.75rem", pageBreakInside: "avoid" }}>
      <div style={{ padding:"0.25rem 0.75rem", background:"rgba(0,0,0,0.02)", borderBottom:"1px solid #e5e7eb", fontSize:"0.7rem", color:"#9ca3af", display:"flex", gap:"0.75rem" }}>
        <span style={{ fontWeight: 600, color: "#0D2644" }}>#Jogo {jogo.ordem_na_fase || "?"}</span>
        {grupoA && <span style={{ fontWeight: 600, color: "#0D2644" }}>{grupoA}</span>}
        {showTime && <span>🕐 {formatHora(jogo.data_hora)}</span>}
        {jogo.local && <span>📍 {jogo.local}</span>}
      </div>
      
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0.75rem", borderBottom:"1px solid #e5e7eb" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", overflow:"hidden", flex: 1 }}>
          <img src={jogo.time_a?.imagem_url || "/logo.png"} alt="" style={{ width:"22px", height:"22px", flexShrink:0, borderRadius:"50%", objectFit:"cover", border: "1px solid #e2e8f0", background: "#f8fafc" }} />
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ fontWeight: 600, fontSize:"0.8125rem", color: "inherit", textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden", lineHeight: "1.2" }}>{nomeA}</span>
            {distritoA && <span style={{ fontSize:"0.65rem", color:"#9ca3af", textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden", lineHeight: "1.2" }}>{distritoA}</span>}
          </div>
        </div>
        <span style={{ width:"24px", height:"16px", border:"1px solid #ccc", borderRadius:"2px", display:"inline-block" }}></span>
      </div>
      
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0.75rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", overflow:"hidden", flex: 1 }}>
          <img src={jogo.time_b?.imagem_url || "/logo.png"} alt="" style={{ width:"22px", height:"22px", flexShrink:0, borderRadius:"50%", objectFit:"cover", border: "1px solid #e2e8f0", background: "#f8fafc" }} />
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ fontWeight: 600, fontSize:"0.8125rem", color: "inherit", textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden", lineHeight: "1.2" }}>{nomeB}</span>
            {distritoB && <span style={{ fontSize:"0.65rem", color:"#9ca3af", textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden", lineHeight: "1.2" }}>{distritoB}</span>}
          </div>
        </div>
        <span style={{ width:"24px", height:"16px", border:"1px solid #ccc", borderRadius:"2px", display:"inline-block" }}></span>
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

  const thStyle = { padding:"0.375rem 0.25rem", textAlign:"center" as const, fontWeight:700, color:"#6b7280", fontSize:"0.6875rem" };
  const tdStyle = { padding:"0.375rem 0.25rem", textAlign:"center" as const, fontSize:"0.75rem" };

  return (
    <div style={{ overflowX:"auto", marginBottom:"0.5rem" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ borderBottom:"2px solid #e5e7eb" }}>
            <th style={{...thStyle, textAlign:"left", paddingLeft:"0.5rem"}}>#</th>
            <th style={{...thStyle, textAlign:"left", width: "45%"}}>Time</th>
            <th style={thStyle}>J</th>
            <th style={thStyle}>V</th>
            {!isTenis && <th style={thStyle}>E</th>}
            <th style={thStyle}>D</th>
            <th style={thStyle}>{isTenis ? "PM" : "GP"}</th>
            <th style={thStyle}>{isTenis ? "PS" : "GC"}</th>
            <th style={thStyle}>{isTenis ? "SP" : "SG"}</th>
            <th style={{...thStyle, color:"#ca8a04"}}>{isTenis ? "Pts" : "Pts"}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c: any, idx: number) => {
            const nome = c.time?.nome_base || c.time?.nome_igreja || "—";
            return (
              <tr key={c.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{...tdStyle, textAlign:"left", paddingLeft:"0.5rem", fontWeight:700, color: "#9ca3af"}}>{idx+1}</td>
                <td style={{...tdStyle, textAlign:"left", fontWeight:600, whiteSpace:"nowrap"}}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.375rem" }}>
                    <img src={c.time?.imagem_url || "/logo.png"} alt="" style={{ width:"20px", height:"20px", borderRadius:"50%", objectFit:"cover" }} />
                    <div style={{ display: "flex", flexDirection: "column", maxWidth: "130px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</span>
                    </div>
                  </div>
                </td>
                {/* Empty cells for printing */}
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                {!isTenis && <td style={tdStyle}></td>}
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  const { data: jogos } = await sb.from("games")
    .select("*, time_a:times!games_time_a_id_fkey(*), time_b:times!games_time_b_id_fkey(*)")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .eq("fase", "Fase de Grupos")
    .order("data_hora", { ascending: true });

  if (!grupos || grupos.length === 0) return <div style={{ padding: "2rem" }}>Nenhum grupo encontrado para {modalidade}</div>;

  const jogosSequential = (jogos || []).sort((a: any, b: any) => a.ordem_na_fase - b.ordem_na_fase);
  const isFutebol = modalidade.includes("Futebol");
  const cols = isFutebol ? 3 : 2;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-wrap { background: white !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
          .page-break { page-break-before: always !important; }
        }
        .print-wrap {
          width: 190mm;
          margin: 15px auto;
          background: white;
          padding: 10mm;
          box-shadow: 0 0 15px rgba(0,0,0,0.05);
          font-family: Arial, Helvetica, sans-serif;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        h2.section-title { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 1.25rem; }
      `}</style>

      <div className="no-print" style={{ background: "white", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>📊 Chaveamento: {modalidade}</h1>
        <PrintButton text="🖨️ Imprimir (A4)" />
      </div>

      <div className="print-wrap">
        <h2 className="section-title">📋 Classificação dos Grupos - {modalidade}</h2>
        
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"1.5rem", marginBottom:"1rem" }}>
          {grupos.map((g: any) => (
            <div key={g.id} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:"1rem", overflow:"hidden", pageBreakInside: "avoid" }}>
              <div style={{ padding:"0.5rem 1rem", background:"linear-gradient(135deg, #2563eb, #1d4ed8)", color:"#fff", fontWeight:700, fontSize:"0.85rem" }}>
                🏟️ {g.nome}
              </div>
              <div style={{ padding:"0.5rem" }}>
                <TabelaClassificacao classificacoes={classificacoes?.filter((c: any) => c.grupo_id === g.id) || []} modalidade={modalidade} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="print-wrap">
        <h2 className="section-title">⚔️ Jogos da Fase de Grupos - {modalidade}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
          {grupos.map((g: any) => (
            <div key={g.id} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {jogosPorGrupo[g.id]?.map((j: any) => (
                <MatchCard key={j.id} jogo={j} grupoA={g.nome} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
