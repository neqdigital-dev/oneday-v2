import { supabaseAdmin } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";

function formatHora(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function TabelaClassificacao({ classificacoes, modalidade }: { classificacoes: any[], modalidade: string }) {
  const isTenis = modalidade.includes("Tênis");
  const sorted = [...classificacoes].sort((a, b) => {
    if (isTenis) {
      if (b.vitorias !== a.vitorias) return (b.vitorias || 0) - (a.vitorias || 0);
      return (b.gols_pro - b.gols_contra) - (a.gols_pro - a.gols_contra);
    }
    const ptA = a.vitorias * 3 + a.empates;
    const ptB = b.vitorias * 3 + b.empates;
    if (ptB !== ptA) return ptB - ptA;
    if (b.vitorias !== a.vitorias) return (b.vitorias || 0) - (a.vitorias || 0);
    return (b.gols_pro - b.gols_contra) - (a.gols_pro - a.gols_contra);
  });

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
      <thead>
        <tr style={{ background: "#e0e0e0" }}>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "left", width: "20px" }}>#</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "left" }}>Time</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "25px" }}>J</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "25px" }}>V</th>
          {!isTenis && <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "25px" }}>E</th>}
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "25px" }}>D</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "35px" }}>{isTenis ? "PM" : "GP"}</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "35px" }}>{isTenis ? "PS" : "GC"}</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "35px" }}>{isTenis ? "SP" : "SG"}</th>
          <th style={{ border: "1px solid #888", padding: "4px 6px", textAlign: "center", width: "35px" }}>Pts</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c: any, idx: number) => {
          const nome = c.time?.nome_base || c.time?.nome_igreja || "—";
          return (
            <tr key={c.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", fontWeight: 600 }}>{nome}</td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
              {!isTenis && <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>}
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center" }}> </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function JogoCard({ jogo, grupoNome }: { jogo: any, grupoNome?: string }) {
  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "A definir";
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "A definir";
  const showTime = !!jogo.data_hora;
  return (
    <div style={{ border: "1.5px solid #333", borderRadius: "6px", overflow: "hidden", marginBottom: "8px", pageBreakInside: "avoid", fontSize: "11px" }}>
      <div style={{ background: "#333", color: "#fff", padding: "3px 8px", display: "flex", gap: "12px", fontWeight: "bold", fontSize: "10px" }}>
        <span>#Jogo {jogo.ordem_na_fase || "?"}</span>
        {grupoNome && <span>{grupoNome}</span>}
        {showTime && <span>🕐 {formatHora(jogo.data_hora)}</span>}
        {jogo.local && <span>📍 {jogo.local}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "5px 8px", borderBottom: "1px solid #ddd", gap: "8px" }}>
        <span style={{ flex: 1, fontWeight: 600 }}>{nomeA}</span>
        <span style={{ width: "30px", height: "22px", border: "1.5px solid #333", borderRadius: "3px", display: "inline-block" }}></span>
      </div>
      <div style={{ display: "flex", alignItems: "center", padding: "5px 8px", gap: "8px" }}>
        <span style={{ flex: 1, fontWeight: 600 }}>{nomeB}</span>
        <span style={{ width: "30px", height: "22px", border: "1.5px solid #333", borderRadius: "3px", display: "inline-block" }}></span>
      </div>
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

  // Group jogos by grupo
  const jogosPorGrupo: Record<string, any[]> = {};
  for (const g of grupos) {
    jogosPorGrupo[g.id] = (jogos || []).filter((j: any) => {
      const cA = classificacoes?.find((c: any) => c.time_id === j.time_a_id);
      const cB = classificacoes?.find((c: any) => c.time_id === j.time_b_id);
      return cA?.grupo_id === g.id || cB?.grupo_id === g.id;
    }).sort((a: any, b: any) => a.ordem_na_fase - b.ordem_na_fase);
  }

  return (
    <div style={{ background: "#eee", minHeight: "100vh" }}>
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-wrap { background: white !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
          .page-break { page-break-before: always !important; }
        }
        .print-wrap {
          width: 190mm;
          margin: 15px auto;
          background: white;
          padding: 10mm;
          box-shadow: 0 0 15px rgba(0,0,0,0.15);
          font-family: Arial, Helvetica, sans-serif;
        }
        h1.doc-title { font-size: 16px; text-align: center; border-bottom: 2.5px solid #000; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        h2.group-title { font-size: 13px; background: #222; color: white; padding: 4px 10px; margin: 10px 0 5px; border-radius: 4px; }
      `}</style>

      <div className="no-print" style={{ background: "white", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "1.1rem" }}>📊 Chaveamento: {modalidade}</h1>
        <PrintButton text="🖨️ Imprimir (A4)" />
      </div>

      {/* PAGE 1: CLASSIFICAÇÃO */}
      <div className="print-wrap">
        <h1 className="doc-title">Classificação dos Grupos — {modalidade}</h1>
        {grupos.map((g: any) => (
          <div key={g.id}>
            <h2 className="group-title">{g.nome}</h2>
            <TabelaClassificacao classificacoes={classificacoes?.filter((c: any) => c.grupo_id === g.id) || []} modalidade={modalidade} />
          </div>
        ))}
      </div>

      {/* PAGE 2+: JOGOS POR GRUPO */}
      <div className="print-wrap">
        <h1 className="doc-title">Jogos da Fase de Grupos — {modalidade}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "start" }}>
          {grupos.map((g: any) => (
            <div key={g.id}>
              <h2 className="group-title">{g.nome}</h2>
              {jogosPorGrupo[g.id]?.map((j: any) => (
                <JogoCard key={j.id} jogo={j} grupoNome={g.nome} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
