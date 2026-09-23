"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChaveamentoManualClient() {
  const router = useRouter();
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [modalidade, setModalidade] = useState("");
  const [times, setTimes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<{ id: string; nome: string; times: any[] }[]>([]);
  
  const [numQuadras, setNumQuadras] = useState(2);
  const [horaInicio, setHoraInicio] = useState("08:30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/modalidades").then(r => r.json()).then(data => {
      setModalidades(data);
      if (data.length > 0) setModalidade(data[0].nome);
    });
  }, []);

  useEffect(() => {
    if (!modalidade) return;
    setLoading(true);
    fetch(`/api/times?modalidade=${modalidade}`).then(r => r.json()).then(data => {
      // Filtrar apenas times que pagaram (a API default pode trazer todos)
      // Vamos trazer todos e deixar o super admin alocar
      const pagantes = data.filter((t: any) => t.pagou);
      setTimes(pagantes);
      setGrupos([]); // Reset
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [modalidade]);

  // Função para adicionar um novo grupo
  function addGrupo() {
    const letra = String.fromCharCode(65 + grupos.length); // A, B, C...
    setGrupos([...grupos, { id: letra, nome: "Grupo " + letra, times: [] }]);
  }

  function moveTime(timeId: string, toGrupoId: string | null) {
    const time = times.find(t => t.id === timeId) || grupos.flatMap(g => g.times).find(t => t.id === timeId);
    if (!time) return;

    // Remover de onde está
    setTimes(prev => prev.filter(t => t.id !== timeId));
    setGrupos(prev => prev.map(g => ({ ...g, times: g.times.filter(t => t.id !== timeId) })));

    // Adicionar no destino
    if (toGrupoId === null) {
      setTimes(prev => [...prev, time]);
    } else {
      setGrupos(prev => prev.map(g => g.id === toGrupoId ? { ...g, times: [...g.times, time] } : g));
    }
  }

  async function handleGerar() {
    if (grupos.length === 0) return toast.error("Crie pelo menos um grupo.");
    if (times.length > 0) {
      if (!confirm(`Ainda há ${times.length} times sem grupo. Eles NÃO participarão. Continuar mesmo assim?`)) return;
    }

    const payload = {
      modalidade,
      num_quadras: numQuadras,
      hora_inicio: horaInicio,
      grupos_manuais: grupos.map(g => ({
        nome: g.nome,
        times: g.times.map(t => t.id)
      })).filter(g => g.times.length > 0) // ignorar grupos vazios
    };

    if (payload.grupos_manuais.length < 1) return toast.error("Não há times nos grupos.");

    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/gerar-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("Chaveamento manual gerado com sucesso!");
        router.push("/admin/painel-admin");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao gerar chaveamento");
      }
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 className="heading-lg">Montar Grupos Manualmente</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Escolha a dedo qual time vai para qual grupo.</p>
        </div>
        <Link href="/super-admin/dashboard" className="btn btn-outline">⬅️ Voltar</Link>
      </div>

      <div className="card card-padded" style={{ marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="input-group">
          <label className="input-label">MODALIDADE</label>
          <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
            {modalidades.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Nº DE QUADRAS SIMULTÂNEAS</label>
          <input type="number" className="input" min={1} max={10} value={numQuadras} onChange={e => setNumQuadras(Number(e.target.value))} />
        </div>
        <div className="input-group">
          <label className="input-label">HORÁRIO DE INÍCIO</label>
          <input type="time" className="input" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
        
        {/* Times sem grupo */}
        <div className="card card-padded" style={{ background: "var(--gray-50)", border: "2px dashed var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className="heading-md">Times Disponíveis ({times.length})</h3>
            <button onClick={addGrupo} className="btn btn-outline" style={{ borderColor: "var(--brand-blue)", color: "var(--brand-blue)" }}>➕ Adicionar Grupo</button>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", minHeight: "60px", padding: "1rem", background: "#fff", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
            {times.length === 0 && <span style={{ color: "var(--text-muted)" }}>Nenhum time sobrando.</span>}
            {times.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--primary-100)", color: "var(--primary-800)", padding: "0.25rem 0.5rem 0.25rem 0.25rem", borderRadius: "2rem", border: "1px solid var(--primary-300)" }}>
                <img src={t.imagem_url || "/logo.png"} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", background: "#fff" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{t.nome_base || t.nome_igreja}</span>
                <select 
                  onChange={(e) => moveTime(t.id, e.target.value)}
                  style={{ marginLeft: "0.5rem", border: "none", background: "#fff", borderRadius: "1rem", fontSize: "0.75rem", padding: "0.1rem 0.5rem", cursor: "pointer" }}
                >
                  <option value="">Alocar em...</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Grupos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {grupos.map(g => (
            <div key={g.id} className="card" style={{ borderTop: "4px solid var(--primary)", overflow: "hidden" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--gray-50)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontWeight: 700 }}>{g.nome} ({g.times.length})</h4>
                <button onClick={() => {
                  if (confirm("Remover este grupo e devolver os times para a lista?")) {
                    g.times.forEach(t => moveTime(t.id, null));
                    setGrupos(prev => prev.filter(pg => pg.id !== g.id));
                  }
                }} style={{ background: "transparent", border: "none", color: "var(--red-500)", cursor: "pointer", fontSize: "1.2rem" }}>🗑️</button>
              </div>
              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "100px" }}>
                {g.times.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", marginTop: "1rem" }}>Grupo vazio. Mova times para cá.</span>}
                {g.times.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <img src={t.imagem_url || "/logo.png"} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{t.nome_base || t.nome_igreja}</span>
                    </div>
                    <button onClick={() => moveTime(t.id, null)} style={{ border: "none", background: "var(--red-100)", color: "var(--red-600)", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleGerar} disabled={loading || grupos.length === 0} className="btn btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.125rem", borderRadius: "2rem" }}>
            {loading ? "Gerando..." : "🚀 Gerar Chaveamento Manual"}
          </button>
        </div>

      </div>
    </div>
  );
}
