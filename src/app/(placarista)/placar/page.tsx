"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";

function PlacarForm({ jogo, onSaved }: { jogo: any; onSaved: () => void }) {
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

      if (woVencedorId) {
        payload.finalizado = true;
        if (isFut) {
          payload.gols_time_a = woVencedorId === jogo.time_a_id ? 3 : 0;
          payload.gols_time_b = woVencedorId === jogo.time_b_id ? 3 : 0;
        } else {
          payload.sets_vencidos_a = woVencedorId === jogo.time_a_id ? 2 : 0;
          payload.sets_vencidos_b = woVencedorId === jogo.time_b_id ? 2 : 0;
        }
      }

      const res = await fetch(`/api/jogos/${jogo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { toast.error("Erro ao salvar."); return; }
      toast.success(finalizar || woVencedorId ? "Jogo finalizado!" : "Placar salvo!");
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "Time A";
  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "Time B";

  return (
    <div className="card card-padded animate-fade-in" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>{jogo.modalidade}</span>
          <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>{jogo.fase}</span>
          {jogo.local && <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>📍 {jogo.local}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ textAlign: "center" }}>
          {jogo.time_a?.imagem_url && <img src={jogo.time_a.imagem_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.5rem" }} />}
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
          {jogo.time_b?.imagem_url && <img src={jogo.time_b.imagem_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.5rem" }} />}
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
          {loading ? "Salvando..." : "✓ Finalizar jogo"}
        </button>
      </div>
    </div>
  );
}

export default function PlacarPage() {
  const [jogos, setJogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadJogos() {
    setLoading(true);
    try {
      const res = await fetch("/api/jogos?finalizado=false");
      const data = await res.json();
      setJogos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadJogos(); }, []);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container-sm">
          <div className="section-header" style={{ marginBottom: "1.5rem" }}>
            <div>
              <h1 className="heading-lg">🎯 Inserir Placar</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{jogos.length} jogos pendentes</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadJogos}>🔄 Atualizar</button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "200px" }} />)}
            </div>
          ) : jogos.length === 0 ? (
            <div className="card card-padded" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
              <h3 className="heading-sm">Todos os jogos finalizados!</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Não há jogos pendentes no momento.</p>
            </div>
          ) : (
            jogos.map(jogo => <PlacarForm key={jogo.id} jogo={jogo} onSaved={loadJogos} />)
          )}
        </div>
      </main>
    </div>
  );
}
