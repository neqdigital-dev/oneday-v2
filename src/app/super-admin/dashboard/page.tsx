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
    } catch (e) {
      toast.error("Erro interno");
    }
    setLoading(false);
  }

  async function handleGenerateBracket() {
    if (!confirm("Tem certeza que deseja gerar o chaveamento para " + modalidade + "? (Os times pagantes serão distribuídos nos grupos)")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade, num_quadras: numQuadras, hora_inicio: horaInicio })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Chaveamento gerado! " + data.grupos + " grupos, " + data.jogos + " jogos criados.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao gerar chaveamento");
      }
    } catch (e) {
      toast.error("Erro interno");
    }
    setLoading(false);
  }

  async function handleClearBracket() {
    if (!confirm("Isso apagará TODO O CHAVEAMENTO e TODOS OS JOGOS DESTA MODALIDADE. Tem certeza absoluta?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/limpar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) toast.success("Chaveamento limpo com sucesso!");
      else toast.error("Erro ao limpar chaveamento");
    } catch (e) {
      toast.error("Erro interno");
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 className="heading-lg">Painel do Super Admin</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Controle total sobre o campeonato. Cuidado com ações destrutivas.
          </p>
        </div>
        <Link href="/super-admin/auditoria" className="btn btn-outline" style={{ whiteSpace: "nowrap" }}>
          📋 Log de Auditoria
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Card 1: Novo Campeonato */}
        <div className="card card-padded">
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-orange, #F05E23)" }}>🏆 Gerar Novo Campeonato</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Cria um novo banco de dados para o campeonato. O atual será arquivado automaticamente.
          </p>
          <form onSubmit={handleCreateChampionship} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">NOME DO CAMPEONATO</label>
              <input type="text" className="input" placeholder="Ex: OneDay 2027" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">ANO</label>
              <input type="number" className="input" value={ano} onChange={e => setAno(Number(e.target.value))} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Criando..." : "➕ Criar Novo Campeonato"}
            </button>
          </form>
        </div>

        {/* Card 2: Chaveamento */}
        <div className="card card-padded">
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-blue, #0D2644)" }}>⚽ Controle de Chaveamento</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Gere as chaves automaticamente após o término das inscrições.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">MODALIDADE</label>
              <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
                <option value="futebol-masc">Futebol Masculino</option>
                <option value="futebol-fem">Futebol Feminino</option>
                <option value="volei">Vôlei Misto</option>
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

            <button onClick={handleGenerateBracket} className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Gerando..." : "⚽ Gerar Chaveamento"}
            </button>
            <button onClick={handleClearBracket} className="btn btn-danger" disabled={loading} style={{ width: "100%" }}>
              🗑️ Limpar Chaveamento (Resetar)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
