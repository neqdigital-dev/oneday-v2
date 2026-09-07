"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  
  const [modalidade, setModalidade] = useState("futebol-masc");
  const [numQuadras, setNumQuadras] = useState(2);
  const [horaInicio, setHoraInicio] = useState("08:30");
  
  const [qtdTimes, setQtdTimes] = useState(8);

  const [modalidadeReagenda, setModalidadeReagenda] = useState("futebol-masc");
  const [numQuadrasReagenda, setNumQuadrasReagenda] = useState(1);
  const [horaReagenda, setHoraReagenda] = useState("10:30");

  async function handleCreateChampionship(e: any) {
    e.preventDefault();
    if (!confirm("Atenção! Gerar um novo campeonato arquivará todos os dados do campeonato atual. Você tem certeza?")) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/campeonato/novo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ano })
      });
      if (res.ok) {
        toast.success("Novo campeonato criado com sucesso!");
        setNome("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar campeonato");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleGenerateBracket() {
    if (!confirm("Tem certeza que deseja gerar o chaveamento para " + modalidade + "?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade, num_quadras: numQuadras, hora_inicio: horaInicio })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Chaveamento gerado! " + data.grupos + " grupos formados.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao gerar chaveamento");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleClearBracket() {
    if (!confirm("Isso apagará TODO O CHAVEAMENTO desta modalidade. Tem certeza absoluta?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/limpar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) toast.success("Chaveamento limpo com sucesso!");
      else toast.error("Erro ao limpar chaveamento");
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleReagendar() {
    if (!confirm(`Mudar todos os jogos PENDENTES de ${modalidadeReagenda} para ${numQuadrasReagenda} quadra(s) iniciando às ${horaReagenda}?`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/reagendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade: modalidadeReagenda, num_quadras: numQuadrasReagenda, hora_inicio: horaReagenda })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.reagendados} jogos pendentes reagendados com sucesso!`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao reagendar");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 className="heading-lg">Painel do Super Admin</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Controle total sobre o campeonato.</p>
        </div>
        <Link href="/super-admin/auditoria" className="btn btn-outline" style={{ whiteSpace: "nowrap" }}>📋 Log de Auditoria</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Card 1: Chaveamento */}
        <div className="card card-padded" style={{ display: "flex", flexDirection: "column" }}>
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-blue, #0D2644)" }}>⚽ Controle de Chaveamento</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">MODALIDADE GERAL</label>
              <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
                <option value="futebol-masc">Futebol Masculino</option>
                <option value="futebol-fem">Futebol Feminino</option>
                <option value="volei-misto-6">Vôlei Sexteto Misto</option>
                <option value="volei-masc-4">Vôlei Quarteto Masculino</option>
                <option value="volei-fem-4">Vôlei Quarteto Feminino</option>
                <option value="ping-pong">Ping-Pong</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Nº DE QUADRAS</label>
                <input type="number" className="input" min={1} max={10} value={numQuadras} onChange={e => setNumQuadras(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">HORÁRIO DO 1º JOGO</label>
                <input type="time" className="input" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
              </div>
            </div>

            <button onClick={handleGenerateBracket} className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "auto" }}>
              {loading ? "Gerando..." : "⚽ Gerar Chaveamento Inicial"}
            </button>
            <button onClick={handleClearBracket} className="btn btn-outline" disabled={loading} style={{ width: "100%" }}>
              🗑️ Limpar Chaveamento
            </button>
          </div>
        </div>

        {/* Card 2: Plano de Chuva (Reagendamento) */}
        <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px solid #3b82f6" }}>
          <h3 className="heading-md" style={{ marginBottom: "0.5rem", color: "#3b82f6" }}>🌧️ Plano de Chuva (Reagendar)</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", flex: 1 }}>
            Mudou o número de quadras no meio do evento? Realoque os <b>jogos pendentes</b> sem afetar o que já foi jogado.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">MODALIDADE GERAL</label>
              <select className="input" value={modalidadeReagenda} onChange={e => setModalidadeReagenda(e.target.value)}>
                <option value="futebol-masc">Futebol Masculino</option>
                <option value="futebol-fem">Futebol Feminino</option>
                <option value="volei-misto-6">Vôlei Sexteto Misto</option>
                <option value="volei-masc-4">Vôlei Quarteto Masculino</option>
                <option value="volei-fem-4">Vôlei Quarteto Feminino</option>
                <option value="ping-pong">Ping-Pong</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">NOVAS QUADRAS</label>
                <input type="number" className="input" min={1} max={10} value={numQuadrasReagenda} onChange={e => setNumQuadrasReagenda(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">RECOMEÇAR ÀS</label>
                <input type="time" className="input" value={horaReagenda} onChange={e => setHoraReagenda(e.target.value)} />
              </div>
            </div>

            <button onClick={handleReagendar} className="btn" style={{ width: "100%", marginTop: "auto", backgroundColor: "#3b82f6", color: "#fff" }} disabled={loading}>
              {loading ? "Processando..." : "🔄 Reagendar Pendentes"}
            </button>
          </div>
        </div>

        {/* Card 3: Simulação de Testes */}
        <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px dashed var(--brand-300)" }}>
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-600)" }}>🧪 Modo Simulação</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", flex: 1 }}>
            Testes usando a <b>modalidade selecionada no 1º quadro</b>.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

            <button onClick={handleGerarTimes} className="btn btn-success" disabled={loading} style={{ width: "100%" }}>
              1. Criar {qtdTimes} times falsos
            </button>
            <button onClick={handleSimularPlacares} className="btn btn-warning" disabled={loading} style={{ width: "100%", color: "#000" }}>
              3. Simular Resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
