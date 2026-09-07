"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [modalidade, setModalidade] = useState("futebol-masc");

  async function handleCreateChampionship(e: any) {
    e.preventDefault();
    if (!confirm("Atenção! Gerar um novo campeonato arquivará todos os dados do campeonato atual. Você tem certeza?")) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/campeonato/novo", {
        method: "POST",
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
    if (!confirm("Tem certeza que deseja gerar o chaveamento para esta modalidade? (As vagas devem estar completas)")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/gerar", {
        method: "POST",
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Chaveamento gerado! ${data.grupos} grupos formados.`);
      } else {
        toast.error("Erro ao gerar chaveamento");
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
      <h2 className="heading-lg" style={{ marginBottom: "1rem" }}>Painel do Super Admin</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Nesta área você tem controle total sobre o campeonato. Cuidado com ações destrutivas.
      </p>

      <div className="form-grid-2">
        <div className="card card-padded">
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-orange)" }}>1. Gerar Novo Campeonato</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Cria um novo banco de dados para o campeonato. O atual será arquivado.
          </p>
          <form onSubmit={handleCreateChampionship} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">Nome do Campeonato</label>
              <input type="text" className="input" placeholder="Ex: OneDay 2027" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">Ano</label>
              <input type="number" className="input" value={ano} onChange={e => setAno(Number(e.target.value))} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>+ Criar Novo Campeonato</button>
          </form>
        </div>

        <div className="card card-padded">
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-blue)" }}>2. Controle de Chaveamento</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Gere as chaves automaticamente após o término das inscrições.
          </p>
          
          <div className="input-group" style={{ marginBottom: "1rem" }}>
            <label className="input-label">Modalidade</label>
            <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
              <option value="futebol-masc">Futebol Masculino</option>
              <option value="futebol-fem">Futebol Feminino</option>
              <option value="volei">Vôlei Misto</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
            <button onClick={handleGenerateBracket} className="btn btn-success" disabled={loading}>
              ⚽ Gerar Chaveamento
            </button>
            <button onClick={handleClearBracket} className="btn btn-danger" disabled={loading}>
              🗑️ Limpar Chaveamento (Resetar)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

