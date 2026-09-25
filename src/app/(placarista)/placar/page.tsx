"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { toast } from "react-hot-toast";

function PlacarForm({ jogo, onSaved }: { jogo: any, onSaved: () => void }) {
  const isFut = jogo.modalidade?.includes("Futebol");
  const [gA, setGolsA] = useState(jogo.gols_time_a ?? 0);
  const [gB, setGolsB] = useState(jogo.gols_time_b ?? 0);
  const [sA, setSetsA] = useState(jogo.sets_vencidos_a ?? 0);
  const [sB, setSetsB] = useState(jogo.sets_vencidos_b ?? 0);
  const [loading, setLoading] = useState(false);

  async function handleSave(finalizar: boolean, woVencedorId: string | null = null) {
    if (woVencedorId && !confirm("Tem certeza que deseja declarar W.O.? Isso não pode ser desfeito.")) return;
    
    setLoading(true);
    try {
      const payload: any = {
        modalidade: jogo.modalidade,
        time_a_id: jogo.time_a_id,
        time_b_id: jogo.time_b_id,
        gols_time_a: isFut ? gA : null,
        gols_time_b: isFut ? gB : null,
        sets_vencidos_a: !isFut ? sA : null,
        sets_vencidos_b: !isFut ? sB : null,
        finalizado: finalizar,
        fase: jogo.fase,
        grupo_id: jogo.grupo_id,
        vencedor_wo_id: woVencedorId
      };

      const res = await fetch(`/api/jogos/${jogo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(finalizar ? "Jogo finalizado!" : "Placar parcial salvo!");
        if (finalizar) onSaved();
      } else toast.error("Erro ao salvar");
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "Time A";
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "Time B";

  return (
    <div className="card card-padded">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: "500" }}>
          <b>{jogo.modalidade}</b> | #Jogo {jogo.ordem_na_fase || "?"} | {jogo.fase}
        </div>
        <div>
          {jogo.local && <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>📌 {jogo.local}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ textAlign: "center" }}>
          <img src={jogo.time_a?.imagem_url || "/logo.png"} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.5rem" }} />}
          <div style={{ fontWeight: "700", fontSize: "0.9375rem", marginBottom: "0.75rem" }}>{nomeA}</div>
          {isFut ? (
            <input type="number" min="0" value={gA} onChange={e => setGolsA(parseInt(e.target.value) || 0)} className="input" style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "800", padding: "0.5rem" }} />
          ) : (
            <input type="number" min="0" max="3" value={sA} onChange={e => setSetsA(parseInt(e.target.value) || 0)} className="input" style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "800", padding: "0.5rem" }} />
          )}
          <button className="btn btn-outline btn-sm" style={{ marginTop: "0.5rem", width: "100%", fontSize: "0.7rem" }} onClick={() => handleSave(true, jogo.time_b_id)} disabled={loading}>
            W.O. (Não Veio)
          </button>
        </div>

        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1.5rem", fontWeight: "300" }}>×</div>

        <div style={{ textAlign: "center" }}>
          <img src={jogo.time_b?.imagem_url || "/logo.png"} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.5rem" }} />}
          <div style={{ fontWeight: "700", fontSize: "0.9375rem", marginBottom: "0.75rem" }}>{nomeB}</div>
          {isFut ? (
            <input type="number" min="0" value={gB} onChange={e => setGolsB(parseInt(e.target.value) || 0)} className="input" style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "800", padding: "0.5rem" }} />
          ) : (
            <input type="number" min="0" max="3" value={sB} onChange={e => setSetsB(parseInt(e.target.value) || 0)} className="input" style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "800", padding: "0.5rem" }} />
          )}
          <button className="btn btn-outline btn-sm" style={{ marginTop: "0.5rem", width: "100%", fontSize: "0.7rem" }} onClick={() => handleSave(true, jogo.time_a_id)} disabled={loading}>
            W.O. (Não Veio)
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleSave(false)} disabled={loading}>Salvar parcial</button>
        <button id={`finalizar-${jogo.id}`} className="btn btn-success" style={{ flex: 2 }} onClick={() => handleSave(true)} disabled={loading}>
          {loading ? "Salvando..." : "– Finalizar jogo"}
        </button>
      </div>
    </div>
  );
}

export default function PlacarPage() {
  const [jogos, setJogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Todos");
  const [modalidadesAtivas, setModalidadesAtivas] = useState<string[]>(["Todos"]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch both pendentes and all modalities with games
      const resJogos = await fetch("/api/jogos?finalizado=false");
      const dataJogos = await resJogos.json();
      const jogosValidos = Array.isArray(dataJogos) 
        ? dataJogos.filter((j: any) => j.time_a_id && j.time_b_id).sort((a: any, b: any) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()) 
        : [];
      setJogos(jogosValidos);

      const resMod = await fetch("/api/modalidades");
      const dataMod = await resMod.json();
      // Only keep modalities that have teams/groups, wait, we can just fetch all and only show those that have games.
      // But we don't have all games here, just pending. 
      // Let's just fetch all groups to know which modalities are active.
      const resG = await fetch("/api/campeonato");
      const dataCamp = await resG.json();
      if (dataCamp.grupos) {
         const mods = Array.from(new Set(dataCamp.grupos.map((g: any) => g.modalidade)));
         setModalidadesAtivas(["Todos", ...(mods as string[])].sort());
      } else {
         setModalidadesAtivas(["Todos", "Futebol Masculino", "Tênis de Mesa", "Vôlei Feminino", "Vôlei Masculino"]);
      }

    } finally {
      setLoading(false);
    }
  }
	 
  

  async function handleGerarMataMata() {
    if (activeTab === "Todos") {
      toast.error("Selecione uma modalidade específica para gerar o mata-mata.");
      return;
    }
    const pwd = window.prompt(`Digite a senha de segurança para gerar o mata-mata de ${activeTab}:`);
    if (pwd !== "3434") {
      toast.error("Senha incorreta. Ação cancelada.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/mata-mata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade: activeTab })
      });
      if (res.ok) {
        toast.success(`Mata-mata gerado com sucesso para ${activeTab}!`);
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao gerar Mata-Mata");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container-sm">
          <div className="section-header" style={{ marginBottom: "1.5rem" }}>
            <div>
              <h1 className="heading-lg">🎯 Inserir Placar</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{jogos.length} jogos pendentes</p>
  
            {activeTab !== "Todos" && (
              <button 
                onClick={handleGerarMataMata} 
                className="btn btn-sm" 
                style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", border: "none", fontWeight: "bold" }}
              >
                🏆 Gerar Mata-Mata
              </button>
            )}
          </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/checkin" className="btn btn-primary btn-sm" style={{ background: "#e2e8f0", color: "#1e293b", border: "none" }}>✅ Check-in</Link>
              <Link href="/sumulas" className="btn btn-primary btn-sm">🖨️ Súmulas</Link>
              <button className="btn btn-ghost btn-sm" onClick={loadData}>🔑 Atualizar</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
            {modalidadesAtivas.map(mod => (
              <button
                key={mod}
                onClick={() => setActiveTab(mod)}
                className={`btn btn-sm ${activeTab === mod ? "btn-primary" : "btn-ghost"}`}
                style={{ whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {mod}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "200px" }} />)}
            </div>
          ) : jogos.filter(j => activeTab === "Todos" || j.modalidade === activeTab).length === 0 ? (
            <div className="card card-padded" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✄</div>
              <h3 className="heading-sm">Todos os jogos finalizados!</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Não há jogos pendentes no momento.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {jogos.filter(j => activeTab === "Todos" || j.modalidade === activeTab).map(jogo => (
                <PlacarForm key={jogo.id} jogo={jogo} onSaved={loadData} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
