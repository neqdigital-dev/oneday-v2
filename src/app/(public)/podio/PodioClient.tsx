"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getModalidadeIcon(mod: string) {
  if (mod.includes("Futebol")) return mod.includes("Feminino") ? "🏃‍♀️" : "⚽";
  if (mod.includes("Vôlei")) return "🏐";
  if (mod.includes("Tênis")) return "🏓";
  return "🏅";
}

function PodiumUI({ p, mod }: { p: any; mod: string }) {
  if (!p) return null;
  return (
    <div style={{ background: "var(--glass-bg,#fff)", border: "1px solid var(--glass-border,#e5e7eb)", borderRadius: "1rem", padding: "2rem 1.5rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, var(--primary,#2563eb), #60a5fa)" }} />
      <h3 style={{ textAlign: "center", fontSize: "1.125rem", fontWeight: 800, color: "var(--brand-blue,#0D2644)", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
        {getModalidadeIcon(mod)} {mod}
      </h3>
      
      <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-end", gap:"1rem" }}>
        {/* 2nd place */}
        {p.vice && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", transform:"translateY(1.5rem)", width:"30%" }}>
            <div style={{ width:"55px", height:"55px", borderRadius:"50%", border:"4px solid #94a3b8", overflow:"hidden", marginBottom:"0.5rem", background:"#fff" }}>
              <img src={p.vice.imagem_url || "/logo.png"} alt="" style={{width:"100%",height:"100%",objectFit:"cover", background: "#f8fafc"}}/>
            </div>
            <span style={{ fontWeight:700, fontSize:"0.8125rem", color:"var(--text-secondary)" }}>2º Lugar</span>
            <span style={{ fontSize:"0.6875rem", color:"var(--text-muted)", textAlign:"center", lineHeight:1.2, marginTop:"0.25rem", display: "flex", flexDirection: "column" }}>
              {p.vice.nome_base || p.vice.nome_igreja}
              {p.vice.distrito && <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>{p.vice.distrito}</span>}
            </span>
          </div>
        )}
        {/* 1st place */}
        {p.campeao && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", zIndex:10, width:"40%" }}>
            <div style={{ fontSize:"1.75rem", marginBottom:"-0.5rem", zIndex:11 }}>👑</div>
            <div style={{ width:"80px", height:"80px", borderRadius:"50%", border:"5px solid #eab308", overflow:"hidden", marginBottom:"0.5rem", background:"#fff", boxShadow:"0 10px 25px -5px rgba(234,179,8,0.4)" }}>
              <img src={p.campeao.imagem_url || "/logo.png"} alt="" style={{width:"100%",height:"100%",objectFit:"cover", background: "#f8fafc"}}/>
            </div>
            <span style={{ fontWeight:800, fontSize:"1rem", color:"#ca8a04" }}>CAMPEÃO</span>
            <span style={{ fontSize:"0.75rem", fontWeight:700, textAlign:"center", lineHeight:1.2, marginTop:"0.25rem", display: "flex", flexDirection: "column" }}>
              {p.campeao.nome_base || p.campeao.nome_igreja}
              {p.campeao.distrito && <span style={{ fontSize: "0.65rem", opacity: 0.8, fontWeight: 500 }}>{p.campeao.distrito}</span>}
            </span>
          </div>
        )}
        {/* 3rd place */}
        {p.terceiro && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", transform:"translateY(2.5rem)", width:"30%" }}>
            <div style={{ width:"45px", height:"45px", borderRadius:"50%", border:"3px solid #b45309", overflow:"hidden", marginBottom:"0.5rem", background:"#fff" }}>
              <img src={p.terceiro.imagem_url || "/logo.png"} alt="" style={{width:"100%",height:"100%",objectFit:"cover", background: "#f8fafc"}}/>
            </div>
            <span style={{ fontWeight:700, fontSize:"0.8125rem", color:"var(--text-secondary)" }}>3º Lugar</span>
            <span style={{ fontSize:"0.6875rem", color:"var(--text-muted)", textAlign:"center", lineHeight:1.2, marginTop:"0.25rem", display: "flex", flexDirection: "column" }}>
              {p.terceiro.nome_base || p.terceiro.nome_igreja}
              {p.terceiro.distrito && <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>{p.terceiro.distrito}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PodioClient({ campNome, jogos }: { campNome: string; jogos: any[] }) {
  const router = useRouter();
  
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000); // 15s
    return () => clearInterval(interval);
  }, [router]);

  const modalidades = [...new Set(jogos.map(j => j.modalidade))];
  
  const podios = modalidades.map(mod => {
    const jogosMod = jogos.filter(j => j.modalidade === mod);
    const finalMatch = jogosMod.find(j => j.fase === "Final");
    
    if (!finalMatch || !finalMatch.finalizado || !finalMatch.vencedor_id) return { mod, p: null };

    const campeaoId = finalMatch.vencedor_id;
    const viceId = finalMatch.time_a_id === campeaoId ? finalMatch.time_b_id : finalMatch.time_a_id;
    
    const semiMatches = jogosMod.filter(j => j.fase === "Semifinal");
    let terceiroId = null;
    for (const semi of semiMatches) {
      if (semi.vencedor_id === campeaoId) {
        terceiroId = semi.time_a_id === campeaoId ? semi.time_b_id : semi.time_a_id;
        break;
      }
    }
    
    const getTeam = (tId: string) => jogosMod.find(j => j.time_a_id === tId)?.time_a || jogosMod.find(j => j.time_b_id === tId)?.time_b;
    return { mod, p: { campeao: getTeam(campeaoId), vice: getTeam(viceId), terceiro: getTeam(terceiroId) } };
  }).filter(item => item.p !== null);

  return (
    <>
      <div className="section-header" style={{ marginBottom: "3rem" }}>
        <div>
          <h1 className="heading-lg">
            Pódio Geral — <span className="text-gradient">{campNome}</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Os grandes campeões de cada modalidade</p>
        </div>
      </div>

      {podios.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.5 }}>🏆</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-secondary)" }}>Nenhum pódio formado ainda.</h2>
          <p style={{ marginTop: "0.5rem" }}>Os campeões aparecerão aqui assim que as finais terminarem.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem" }}>
          {podios.map(item => (
            <PodiumUI key={item.mod} mod={item.mod} p={item.p} />
          ))}
        </div>
      )}
    </>
  );
}
