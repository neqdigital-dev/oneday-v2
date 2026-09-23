"use client";
import { useState, CSSProperties } from "react";

function formatHora(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function getModalidadeIcon(mod: string) {
  if (mod.includes("Futebol")) return mod.includes("Feminino") ? "🏃‍♀️" : "⚽";
  if (mod.includes("Vôlei")) return "🏐";
  if (mod.includes("Tênis")) return "🏓";
  return "🏅";
}

function MatchCard({ jogo }: { jogo: any }) {
  const aWins = jogo.finalizado && jogo.vencedor_id === jogo.time_a_id;
  const bWins = jogo.finalizado && jogo.vencedor_id === jogo.time_b_id;
  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "A definir";
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "A definir";
  const isFutebol = jogo.modalidade?.includes("Futebol");
  const isVoleiMasc = jogo.modalidade?.includes("Vôlei") && jogo.modalidade?.includes("Masculino");
  
  const showTime = (isFutebol || isVoleiMasc) && jogo.data_hora;

  return (
    <div style={{ width: "230px", flexShrink: 0, background:"var(--glass-bg,#fff)", border:"1px solid var(--glass-border,#e5e7eb)", borderRadius:"0.75rem", overflow:"hidden" }}>
      {(showTime || jogo.local || jogo.finalizado) && (
        <div style={{ padding:"0.25rem 0.75rem", background:"rgba(0,0,0,0.02)", borderBottom:"1px solid var(--glass-border,#e5e7eb)", fontSize:"0.7rem", color:"var(--text-muted,#9ca3af)", display:"flex", gap:"0.75rem" }}>
          {showTime && <span>🕐 {formatHora(jogo.data_hora)}</span>}
          {jogo.local && <span>📍 {jogo.local}</span>}
          {jogo.finalizado && <span style={{ color:"#10b981", fontWeight:600 }}>✓ Finalizado</span>}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0.75rem", borderBottom:"1px solid var(--glass-border,#e5e7eb)", background: aWins ? "rgba(234,179,8,0.06)" : "transparent", opacity: !jogo.time_a_id ? 0.5 : 1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <img src={jogo.time_a?.imagem_url || "/logo.png"} alt="" style={{ width:"22px", height:"22px", borderRadius:"50%", objectFit:"cover", border: "1px solid #e2e8f0", background: "#f8fafc" }} />
          <span style={{ fontWeight: aWins ? 700 : 500, fontSize:"0.8125rem", color: aWins ? "var(--gold-400,#ca8a04)" : "inherit" }}>{nomeA} {aWins && "🏆"}</span>
        </div>
        <span style={{ fontWeight:700, fontSize:"0.875rem", minWidth:"24px", textAlign:"center" as const }}>
          {jogo.finalizado ? (isFutebol ? jogo.gols_time_a ?? "—" : jogo.sets_vencidos_a ?? "—") : "—"}
        </span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0.75rem", background: bWins ? "rgba(234,179,8,0.06)" : "transparent", opacity: !jogo.time_b_id ? 0.5 : 1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <img src={jogo.time_b?.imagem_url || "/logo.png"} alt="" style={{ width:"22px", height:"22px", borderRadius:"50%", objectFit:"cover", border: "1px solid #e2e8f0", background: "#f8fafc" }} />
          <span style={{ fontWeight: bWins ? 700 : 500, fontSize:"0.8125rem", color: bWins ? "var(--gold-400,#ca8a04)" : "inherit" }}>{nomeB} {bWins && "🏆"}</span>
        </div>
        <span style={{ fontWeight:700, fontSize:"0.875rem", minWidth:"24px", textAlign:"center" as const }}>
          {jogo.finalizado ? (isFutebol ? jogo.gols_time_b ?? "—" : jogo.sets_vencidos_b ?? "—") : "—"}
        </span>
      </div>
    </div>
  );
}

function TabelaClassificacao({ classificacoes }: { classificacoes: any[] }) {
  const sorted = [...classificacoes].sort((a, b) => {
    const ptA = a.vitorias * 3 + a.empates;
    const ptB = b.vitorias * 3 + b.empates;
    if (ptB !== ptA) return ptB - ptA;
    const sgA = a.gols_pro - a.gols_contra;
    const sgB = b.gols_pro - b.gols_contra;
    if (sgB !== sgA) return sgB - sgA;
    return b.gols_pro - a.gols_pro;
  });
  const thStyle: CSSProperties = { padding:"0.375rem 0.25rem", textAlign:"center", fontWeight:700, color:"var(--text-secondary,#6b7280)", fontSize:"0.6875rem" };
  const tdStyle: CSSProperties = { padding:"0.375rem 0.25rem", textAlign:"center", fontSize:"0.75rem" };
  return (
    <div style={{ overflowX:"auto", marginBottom:"0.5rem" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ borderBottom:"2px solid var(--glass-border,#e5e7eb)" }}>
            <th style={{...thStyle, textAlign:"left", paddingLeft:"0.5rem"}}>#</th>
            <th style={{...thStyle, textAlign:"left"}}>Time</th>
            <th style={thStyle}>J</th><th style={thStyle}>V</th><th style={thStyle}>E</th>
            <th style={thStyle}>D</th><th style={thStyle}>GP</th><th style={thStyle}>GC</th>
            <th style={thStyle}>SG</th>
            <th style={{...thStyle, color:"var(--gold-400,#ca8a04)"}}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c: any, idx: number) => {
            const pts = c.vitorias * 3 + c.empates;
            const saldo = c.gols_pro - c.gols_contra;
            const nome = c.time?.nome_base || c.time?.nome_igreja || "—";
            const isClassificado = idx < 2;
            return (
              <tr key={c.id} style={{ borderBottom:"1px solid var(--glass-border,#f3f4f6)", background: isClassificado ? "rgba(16,185,129,0.04)" : "transparent" }}>
                <td style={{...tdStyle, textAlign:"left" as const, paddingLeft:"0.5rem", fontWeight:700, color: isClassificado ? "#10b981" : "var(--text-muted,#9ca3af)"}}>{idx+1}</td>
                <td style={{...tdStyle, textAlign:"left" as const, fontWeight:600, whiteSpace:"nowrap"}}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem" }}>
                    {c.time?.imagem_url && <img src={c.time.imagem_url} alt="" style={{ width:"16px", height:"16px", borderRadius:"50%", objectFit:"cover" as const }} />}
                    {nome}
                  </span>
                </td>
                <td style={tdStyle}>{c.jogos_disputados}</td>
                <td style={{...tdStyle, color:"#10b981"}}>{c.vitorias}</td>
                <td style={tdStyle}>{c.empates}</td>
                <td style={{...tdStyle, color:"#ef4444"}}>{c.derrotas}</td>
                <td style={tdStyle}>{c.gols_pro}</td>
                <td style={tdStyle}>{c.gols_contra}</td>
                <td style={{...tdStyle, fontWeight:600}}>{saldo > 0 ? `+${saldo}` : saldo}</td>
                <td style={{...tdStyle, fontWeight:700, color:"var(--gold-400,#ca8a04)"}}>{pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Podium({ p }: { p: any }) {
  if (!p) return null;
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-end", gap:"1rem", margin:"3rem 0" }}>
      {/* 2nd place */}
      {p.vice && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", transform:"translateY(2rem)" }}>
          <div style={{ width:"60px", height:"60px", borderRadius:"50%", border:"4px solid #94a3b8", overflow:"hidden", marginBottom:"0.5rem", background:"#fff" }}>
            <img src={p.vice.imagem_url || "/logo.png"} alt="" style={{width:"100%",height:"100%",objectFit:"cover", background: "#f8fafc"}}/>
          </div>
          <span style={{ fontWeight:700, fontSize:"0.875rem", color:"var(--text-secondary)" }}>2º Lugar</span>
          <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{p.vice.nome_base || p.vice.nome_igreja}</span>
        </div>
      )}
      {/* 1st place */}
      {p.campeao && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", zIndex:10 }}>
          <div style={{ fontSize:"2rem", marginBottom:"-0.5rem", zIndex:11 }}>👑</div>
          <div style={{ width:"90px", height:"90px", borderRadius:"50%", border:"6px solid #eab308", overflow:"hidden", marginBottom:"0.5rem", background:"#fff", boxShadow:"0 10px 25px -5px rgba(234,179,8,0.4)" }}>
            <img src={p.campeao.imagem_url || "/logo.png"} alt="" style={{width:"100%",height:"100%",objectFit:"cover", background: "#f8fafc"}}/>
          </div>
          <span style={{ fontWeight:800, fontSize:"1.125rem", color:"#ca8a04" }}>CAMPEÃO</span>
          <span style={{ fontSize:"0.875rem", fontWeight:600 }}>{p.campeao.nome_base || p.campeao.nome_igreja}</span>
        </div>
      )}
      {/* 3rd place */}
      {p.terceiro && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", transform:"translateY(3rem)" }}>
          <div style={{ width:"50px", height:"50px", borderRadius:"50%", border:"4px solid #b45309", overflow:"hidden", marginBottom:"0.5rem", background:"#fff" }}>
            <img src={p.terceiro.imagem_url || "/logo.png"} alt="" style={{width:"100%",height:"100%",objectFit:"cover", background: "#f8fafc"}}/>
          </div>
          <span style={{ fontWeight:700, fontSize:"0.875rem", color:"var(--text-secondary)" }}>3º Lugar</span>
          <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{p.terceiro.nome_base || p.terceiro.nome_igreja}</span>
        </div>
      )}
    </div>
  );
}

export default function ChaveamentoClient({ campNome, modalidades, jogos, grupos, classificacoes }: {
  campNome: string;
  modalidades: string[];
  jogos: any[];
  grupos: any[];
  classificacoes: any[];
}) {
  const [activeTab, setActiveTab] = useState(modalidades[0] || "");
  const [subTab, setSubTab] = useState<"grupos" | "eliminatoria">("grupos");
  const gruposDoModal = grupos.filter((g: any) => g.modalidade === activeTab).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  const jogosFaseGrupos = jogos.filter((j: any) => j.modalidade === activeTab && j.fase === "Fase de Grupos");
  const jogosMataMata = jogos.filter((j: any) => j.modalidade === activeTab && j.fase !== "Fase de Grupos");
  
  const order = ["Quartas de Final", "Semifinal", "Final"];
  const fasesMataMata: { fase: string; jogos: any[] }[] = [];
  order.forEach(fase => {
    const jogosFase = jogosMataMata.filter((j: any) => j.fase === fase);
    if (jogosFase.length > 0) {
      fasesMataMata.push({ fase, jogos: jogosFase.sort((a: any, b: any) => a.ordem_na_fase - b.ordem_na_fase) });
    }
  });

  const finalMatch = jogosMataMata.find((j: any) => j.fase === "Final");
  let podium = null;
  if (finalMatch?.finalizado && finalMatch.vencedor_id) {
    const campeaoId = finalMatch.vencedor_id;
    const viceId = finalMatch.time_a_id === campeaoId ? finalMatch.time_b_id : finalMatch.time_a_id;
    
    const semiMatches = jogosMataMata.filter((j: any) => j.fase === "Semifinal");
    let terceiroId = null;
    for (const semi of semiMatches) {
      if (semi.vencedor_id === campeaoId) {
        terceiroId = semi.time_a_id === campeaoId ? semi.time_b_id : semi.time_a_id;
        break;
      }
    }
    
    const getTeam = (tId: string) => classificacoes.find((c: any) => c.time_id === tId)?.time || jogosMataMata.find((j: any) => j.time_a_id === tId)?.time_a || jogosMataMata.find((j: any) => j.time_b_id === tId)?.time_b;
    podium = { campeao: getTeam(campeaoId), vice: getTeam(viceId), terceiro: getTeam(terceiroId) };
  }

  return (
    <>
      <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap", marginBottom:"2rem", padding:"0.25rem", background:"var(--glass-bg,#f9fafb)", borderRadius:"0.75rem", border:"1px solid var(--glass-border,#e5e7eb)" }}>
        {modalidades.map((mod: string) => (
          <button key={mod} onClick={() => setActiveTab(mod)} style={{
            padding:"0.5rem 1rem", borderRadius:"0.5rem", border:"none", cursor:"pointer", fontSize:"0.8125rem",
            fontWeight: activeTab === mod ? 700 : 500,
            background: activeTab === mod ? "var(--primary,#2563eb)" : "transparent",
            color: activeTab === mod ? "#fff" : "var(--text-secondary,#6b7280)",
            transition:"all 0.2s ease", whiteSpace:"nowrap"
          }}>
            {getModalidadeIcon(mod)} {mod}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", gap:"1rem", marginBottom:"2rem", borderBottom:"1px solid var(--glass-border,#e5e7eb)" }}>
        <button onClick={() => setSubTab("grupos")} style={{
          padding:"0.75rem 1rem", border:"none", background:"transparent", cursor:"pointer",
          fontWeight: subTab === "grupos" ? 700 : 500,
          color: subTab === "grupos" ? "var(--brand-blue,#0D2644)" : "var(--text-secondary,#6b7280)",
          borderBottom: subTab === "grupos" ? "3px solid var(--primary,#2563eb)" : "3px solid transparent",
          transition:"all 0.2s ease", fontSize:"0.9375rem"
        }}>📋 Fase de Grupos</button>
        
        {fasesMataMata.length > 0 && (
          <button onClick={() => setSubTab("eliminatoria")} style={{
            padding:"0.75rem 1rem", border:"none", background:"transparent", cursor:"pointer",
            fontWeight: subTab === "eliminatoria" ? 700 : 500,
            color: subTab === "eliminatoria" ? "var(--brand-blue,#0D2644)" : "var(--text-secondary,#6b7280)",
            borderBottom: subTab === "eliminatoria" ? "3px solid var(--primary,#2563eb)" : "3px solid transparent",
            transition:"all 0.2s ease", fontSize:"0.9375rem"
          }}>🏆 Fase Eliminatória</button>
        )}
      </div>

      {subTab === "grupos" && gruposDoModal.length > 0 && (
        <>
          <h2 style={{ fontSize:"0.8125rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-secondary,#6b7280)", marginBottom:"1.25rem" }}>📋 Classificação dos Grupos</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:"1.5rem", marginBottom:"2.5rem" }}>
            {gruposDoModal.map((grupo: any) => {
              const classif = classificacoes.filter((c: any) => c.grupo_id === grupo.id);
              return (
                <div key={grupo.id} style={{ background:"var(--glass-bg,#fff)", border:"1px solid var(--glass-border,#e5e7eb)", borderRadius:"1rem", overflow:"hidden" }}>
                  <div style={{ padding:"0.75rem 1rem", background:"linear-gradient(135deg, var(--primary,#2563eb), var(--primary-600,#1d4ed8))", color:"#fff", fontWeight:700, fontSize:"0.9375rem" }}>🏟️ {grupo.nome}</div>
                  <div style={{ padding:"0.5rem" }}><TabelaClassificacao classificacoes={classif} /></div>
                </div>
              );
            })}
          </div>

          <h2 style={{ fontSize:"0.8125rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-secondary,#6b7280)", marginBottom:"1.25rem" }}>⚔️ Jogos da Fase de Grupos</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem", marginBottom:"3rem", maxWidth:"600px" }}>
            {jogosFaseGrupos.sort((a: any, b: any) => a.ordem_na_fase - b.ordem_na_fase).map((jogo: any) => (
              <MatchCard key={jogo.id} jogo={jogo} />
            ))}
          </div>
        </>
      )}

      {subTab === "eliminatoria" && fasesMataMata.length > 0 && (
        <>
          <h2 style={{ fontSize:"0.8125rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-secondary,#6b7280)", marginBottom:"1.25rem" }}>🏆 Fase Eliminatória</h2>
          
          <Podium p={podium} />

          {/* Visual Bracket Layout */}
          <div style={{ overflowX:"auto", paddingBottom:"2rem", WebkitOverflowScrolling:"touch" }}>
            <div style={{ display:"flex", gap:"1.5rem", minWidth:"max-content", padding:"1rem" }}>
              {fasesMataMata.map(({ fase, jogos: jogosF }, idx) => (
                <div key={fase} style={{ display:"flex", flexDirection:"column", gap:"2rem", justifyContent:"space-around" }}>
                  <div style={{ textAlign:"center", fontWeight:700, color:"var(--text-secondary)", marginBottom:"-1rem", textTransform:"uppercase", fontSize:"0.75rem", letterSpacing:"0.05em" }}>
                    {fase}
                  </div>
                  {jogosF.map((jogo: any) => (
                    <div key={jogo.id} style={{ position:"relative" }}>
                      <MatchCard jogo={jogo} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {gruposDoModal.length === 0 && jogosMataMata.length === 0 && (
        <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--text-muted,#9ca3af)" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🎯</div>
          <p>Chaveamento de {activeTab} ainda não foi gerado.</p>
        </div>
      )}
    </>
  );
}
