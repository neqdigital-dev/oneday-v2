"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

function NovoCampeonatoForm() {
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear() + 1);
  const [regioes, setRegioes] = useState([
    { nome: "Região 1 | Moving", descricao: "" },
    { nome: "Região 2 | I Am", descricao: "" },
    { nome: "Região 3 | Chamados", descricao: "" },
    { nome: "Região 4 | Together", descricao: "" },
    { nome: "Região 5 | Reaviva", descricao: "" },
    { nome: "Região 6 | Bethel", descricao: "" },
    { nome: "Região 7 | Tô Ligado", descricao: "" },
    { nome: "Região 8 | Forgiven", descricao: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) { toast.error("Nome do campeonato obrigatório."); return; }
    if (!confirm(`Tem certeza? O campeonato atual será ARQUIVADO e um novo campeonato "${nome}" será criado. Todos os cadastros recomeçarão do zero.`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/campeonato/novo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ano, regioes: regioes.filter(r => r.nome) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao criar campeonato."); return; }
      toast.success(`Campeonato "${nome}" criado!`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem", border: "1px solid rgba(139,92,246,0.3)" }}>
      <h2 className="heading-sm" style={{ marginBottom: "0.25rem", color: "#a78bfa" }}>🆕 Criar Novo Campeonato</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Isso arquivará o campeonato atual. Os dados anteriores ficam preservados no histórico.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-grid form-grid-2" style={{ marginBottom: "1.5rem" }}>
          <div className="input-group">
            <label className="input-label">Nome do Campeonato *</label>
            <input id="camp-nome" type="text" className="input" placeholder="Ex: Oneday 2027" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Ano *</label>
            <input id="camp-ano" type="number" className="input" min="2024" max="2099" value={ano} onChange={e => setAno(parseInt(e.target.value))} required />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="input-label" style={{ marginBottom: "0.75rem", display: "block" }}>Regiões (editável)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
            {regioes.map((r, i) => (
              <input key={i} type="text" className="input" style={{ fontSize: "0.8125rem" }}
                value={r.nome}
                onChange={e => setRegioes(prev => prev.map((reg, idx) => idx === i ? { ...reg, nome: e.target.value } : reg))}
                placeholder={`Região ${i + 1}`}
              />
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: "0.75rem" }}
            onClick={() => setRegioes(prev => [...prev, { nome: "", descricao: "" }])}>
            + Adicionar região
          </button>
        </div>

        <div className="alert alert-warning" style={{ marginBottom: "1.25rem" }}>
          ⚠️ <strong>Atenção:</strong> Esta ação é irreversível. O campeonato atual será arquivado.
        </div>
        <button id="btn-criar-campeonato" type="submit" className="btn btn-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }} disabled={loading}>
          {loading ? "Criando..." : "🚀 Criar novo campeonato"}
        </button>
      </form>
    </div>
  );
}

function GerarChaveamentoForm() {
  const [modalidade, setModalidade] = useState("Futebol Masculino");
  const [numQuadras, setNumQuadras] = useState(3);
  const [horaInicio, setHoraInicio] = useState("08:30");
  const [loading, setLoading] = useState("");
  const router = useRouter();

  async function handleGerar() {
    if (!confirm(`Gerar chaveamento para ${modalidade}? Isso apagará o chaveamento anterior desta modalidade.`)) return;
    setLoading("gerar");
    try {
      const res = await fetch("/api/chaveamento/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade, num_quadras: numQuadras, hora_inicio: horaInicio }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao gerar chaveamento."); return; }
      toast.success(`Chaveamento gerado! ${data.grupos} grupos, ${data.jogos} jogos.`);
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  async function handleLimpar() {
    if (!confirm("Tem certeza? TODOS os jogos, grupos e classificações serão apagados do campeonato ativo.")) return;
    setLoading("limpar");
    try {
      const res = await fetch("/api/chaveamento/limpar", { method: "POST" });
      if (!res.ok) { toast.error("Erro ao limpar chaveamento."); return; }
      toast.success("Chaveamento zerado com sucesso!");
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
      <h2 className="heading-sm" style={{ marginBottom: "1.5rem" }}>🎯 Gerar Chaveamento</h2>
      <div className="form-grid form-grid-3" style={{ marginBottom: "1.25rem" }}>
        <div className="input-group">
          <label className="input-label">Modalidade</label>
          <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
            <option>Futebol Masculino</option>
            <option>Futebol Feminino</option>
            <option>Volei Misto</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Nº de Quadras</label>
          <input type="number" className="input" min="1" max="10" value={numQuadras} onChange={e => setNumQuadras(parseInt(e.target.value))} />
        </div>
        <div className="input-group">
          <label className="input-label">Hora de Início</label>
          <input type="time" className="input" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button id="btn-gerar-chaveamento" className="btn btn-primary" onClick={handleGerar} disabled={!!loading}>
          {loading === "gerar" ? "Gerando..." : "⚡ Gerar chaveamento automático"}
        </button>
        <Link href="/chaveamento" className="btn btn-ghost btn-sm">Ver chaveamento →</Link>
        <button id="btn-limpar-chaveamento" className="btn btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={handleLimpar} disabled={!!loading}>
          {loading === "limpar" ? "..." : "🗑️ Limpar tudo"}
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [campeonatos, setCampeonatos] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/campeonato").then(r => r.json()).then(d => setCampeonatos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container-md">
          <div className="section-header" style={{ marginBottom: "2rem" }}>
            <div>
              <h1 className="heading-lg">
                <span style={{ color: "#a78bfa" }}>🔴 Super Admin</span>
              </h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Controle total do campeonato</p>
            </div>
            <Link href="/admin/painel-admin" className="btn btn-ghost btn-sm">Painel Admin →</Link>
          </div>

          <GerarChaveamentoForm />
          <NovoCampeonatoForm />

          {/* Histórico */}
          <div className="card card-padded" style={{ marginBottom: "1.5rem" }}>
            <h2 className="heading-sm" style={{ marginBottom: "1rem" }}>📚 Histórico de Campeonatos</h2>
            <div className="table-wrapper" style={{ border: "none" }}>
              <table className="table">
                <thead><tr><th>Nome</th><th>Ano</th><th>Status</th></tr></thead>
                <tbody>
                  {campeonatos.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: "600" }}>{c.nome}</td>
                      <td>{c.ano}</td>
                      <td><span className={`badge ${c.status === "ativo" ? "badge-green" : "badge-gray"}`}>{c.status === "ativo" ? "✓ Ativo" : "Arquivado"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
