"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SimulacaoClient() {
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [modalidade, setModalidade] = useState("");
  const [qtdTimes, setQtdTimes] = useState(8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/modalidades").then(r => r.json()).then(data => {
      setModalidades(data);
      if (data.length > 0) setModalidade(data[0].nome);
    });
  }, []);

  async function handleGerarTimes() {
    if (!confirm("Deseja criar " + qtdTimes + " times de teste para " + modalidade + "?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulacao/times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade, quantidade: qtdTimes })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.criados + " times fictícios criados!");
      } else toast.error("Erro ao gerar times");
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleSimularPlacares() {
    if (!confirm("Preencher placares aleatórios para todos os jogos em aberto de " + modalidade + "?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulacao/placar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.simulados + " jogos simulados!");
      } else toast.error("Erro ao simular");
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  return (
    <div className="card card-padded" style={{ maxWidth: "600px", border: "2px dashed var(--brand-300)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div className="input-group">
          <label className="input-label">MODALIDADE PARA TESTE</label>
          <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
            {modalidades.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">TIMES FICTÍCIOS A GERAR</label>
          <select className="input" value={qtdTimes} onChange={e => setQtdTimes(Number(e.target.value))}>
            <option value={8}>8 Times</option>
            <option value={11}>11 Times (Teste Ímpar)</option>
            <option value={12}>12 Times</option>
            <option value={13}>13 Times (Teste Ímpar)</option>
            <option value={16}>16 Times</option>
            <option value={20}>20 Times</option>
          </select>
        </div>

        <button onClick={handleGerarTimes} className="btn btn-success" disabled={loading || !modalidade} style={{ width: "100%", padding: "1rem" }}>
          🧪 1. Criar {qtdTimes} times falsos
        </button>
        <button onClick={handleSimularPlacares} className="btn btn-warning" disabled={loading || !modalidade} style={{ width: "100%", padding: "1rem", color: "#000" }}>
          🎲 2. Simular Resultados dos Jogos em Aberto
        </button>
      </div>
    </div>
  );
}
