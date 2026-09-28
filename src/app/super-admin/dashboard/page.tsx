"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<any>(null);
  const [view, setView] = useState<"home" | "painel">("home");
  const [configMod, setConfigMod] = useState<string | null>(null);
  
  const [modalidadesOptions, setModalidadesOptions] = useState<any[]>([]);
  const [novaModalidade, setNovaModalidade] = useState("");

  const [modalidade, setModalidade] = useState("");
  const [numQuadras, setNumQuadras] = useState(2);
  const [horaInicio, setHoraInicio] = useState("08:30");
  const [tempoJogo, setTempoJogo] = useState(15);
  
  const [qtdTimes, setQtdTimes] = useState(8);

  // Plano de chuva state
  const [modalidadeReagenda, setModalidadeReagenda] = useState("");
  const [numQuadrasReagenda, setNumQuadrasReagenda] = useState(1);
  const [horaReagenda, setHoraReagenda] = useState("10:30");
  const [jogosPendentes, setJogosPendentes] = useState<any[]>([]);
  const [jogosEmAndamento, setJogosEmAndamento] = useState<Set<string>>(new Set());
  const [etapaChuva, setEtapaChuva] = useState<"config" | "selecao">("config");

    async function handleExcluirCampeonato(id: string) {
    const text = prompt("Atenção! Isso apagará TODOS os times, grupos, jogos e histórico deste campeonato. Digite EXCLUIR para confirmar:");
    if (text !== "EXCLUIR") {
      toast.error("Cancelado.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/campeonato?id=" + id, { method: "DELETE" });
      if (res.ok) {
        toast.success("Campeonato excluído!");
        loadCampeonatos();
      } else {
        toast.error("Erro ao excluir");
      }
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function loadCampeonatos() {
    try {
      const res = await fetch("/api/campeonato");
      if (res.ok) setCampeonatos(await res.json());
    } catch(e) {}
  }

  async function handleEncerrarCampeonato(id: string) {
    if(!confirm("Tem certeza que deseja encerrar este campeonato? Ele sairá da visão pública e ficará arquivado.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/campeonato/encerrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campeonato_id: id })
      });
      if(res.ok) {
        toast.success("Campeonato encerrado!");
        loadCampeonatos();
      } else {
        toast.error("Erro ao encerrar");
      }
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function loadModalidades() {
    try {
      const res = await fetch("/api/modalidades");
      if (res.ok) {
        const allMods = await res.json();
        
        // Filtra apenas modalidades que têm times cadastrados
        const resTimesRaw = await fetch("/api/times");
        let modsComTimes: string[] = [];
        if (resTimesRaw.ok) {
          const timesData = await resTimesRaw.json();
          const times = Array.isArray(timesData) ? timesData : (timesData.times || []);
          modsComTimes = Array.from(new Set(times.map((t: any) => t.modalidade).filter(Boolean)));
        }

        const filtered = modsComTimes.length > 0 
          ? allMods.filter((m: any) => modsComTimes.includes(m.nome))
          : allMods;

        setModalidadesOptions(filtered);
        if (filtered.length > 0) {
          if (!modalidade) setModalidade(filtered[0].nome);
          if (!modalidadeReagenda) setModalidadeReagenda(filtered[0].nome);
        }
      }
    } catch(e) {}
  }

  useEffect(() => {
    loadModalidades();
    loadCampeonatos();
  }, []);

  async function handleDeleteModalidade(id: string) {
    if (!confirm("Tem certeza que deseja apagar esta modalidade?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/modalidades?id=" + id, { method: "DELETE" });
      if (res.ok) {
        toast.success("Modalidade removida!");
        loadModalidades();
      } else {
        toast.error("Erro ao remover");
      }
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleAddModalidade() {
    if (!novaModalidade) return;
    setLoading(true);
    try {
      const res = await fetch("/api/modalidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaModalidade })
      });
      if (res.ok) {
        toast.success("Modalidade adicionada!");
        setNovaModalidade("");
        loadModalidades();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao adicionar");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

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
        loadCampeonatos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar campeonato");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleGenerateBracket() {
    if (!modalidade) return;
    if (!confirm("Tem certeza que deseja apagar TUDO (times e jogos) desta modalidade e gerar NOVOS GRUPOS aleatórios?")) return;
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

  async function handleGerarJogos() {
    if (!modalidade) return;
    if (!confirm("Isso apagará APENAS os jogos existentes da Fase de Grupos e criará novos baseados nos grupos atuais. Tem certeza?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/gerar-jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade, num_quadras: numQuadras, hora_inicio: horaInicio, tempo_jogo: tempoJogo })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Tabela de jogos gerada! " + data.jogos + " partidas criadas.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao gerar jogos");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }


  async function handleZerarPlacares() {
    const pwd = window.prompt("Digite a senha de segurança para ZERAR OS PLACARES (os jogos e horários serão mantidos):");
    if (pwd !== "740689") {
      toast.error("Senha incorreta. Ação cancelada.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/zerar-placares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) {
        toast.success("Placares zerados! Os jogos da fase de grupos foram mantidos intactos.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao zerar");
      }
    } catch(e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleClearJogos() {
    const pwd = window.prompt("Digite a senha de segurança para zerar APENAS A TABELA DE JOGOS:");
    if (pwd !== "740689") {
      toast.error("Senha incorreta. Ação cancelada.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/limpar-jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) toast.success("Tabela de jogos zerada com sucesso!");
      else toast.error("Erro ao limpar jogos");
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  async function handleClearBracket() {
    if (!confirm("Isso apagará TODO O CHAVEAMENTO desta modalidade. Tem certeza absoluta?")) return;
    
    const wantsToSave = confirm("Deseja salvar os resultados atuais no histórico antes de limpar? (Sim para Salvar, Cancelar para Apenas Limpar)");
    if (wantsToSave) {
      toast("Função de salvar histórico em breve!", { icon: "🚧" });
    }

    const pwd = window.prompt("Digite a senha de segurança para limpar o chaveamento:");
    if (pwd !== "740689") {
      toast.error("Senha incorreta. Ação cancelada.");
      return;
    }

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


  async function handleGerarMataMata() {
    if (!modalidade) return;
    if (!confirm("Isso irá apagar APENAS os jogos da fase eliminatória (Mata-Mata) e gerar os novos confrontos com base na classificação atual. Tem certeza?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chaveamento/mata-mata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalidade })
      });
      if (res.ok) {
        toast.success("Mata-Mata gerado com sucesso!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao gerar Mata-Mata");
      }
    } catch (e) { toast.error("Erro interno"); }
    setLoading(false);
  }

  // ========= PLANO DE CHUVA - NOVO FLUXO =========
  async function handleCarregarJogosPendentes() {
    if (!modalidadeReagenda) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jogos?modalidade=${encodeURIComponent(modalidadeReagenda)}&finalizado=false`);
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? data.sort((a: any, b: any) => (a.ordem_na_fase || 0) - (b.ordem_na_fase || 0))
          : [];
        setJogosPendentes(sorted);
        setJogosEmAndamento(new Set());
        setEtapaChuva("selecao");
        if (sorted.length === 0) {
          toast("Nenhum jogo pendente encontrado!", { icon: "✅" });
        }
      }
    } catch (e) { toast.error("Erro ao carregar jogos"); }
    setLoading(false);
  }

  function toggleEmAndamento(jogoId: string) {
    setJogosEmAndamento(prev => {
      const next = new Set(prev);
      if (next.has(jogoId)) next.delete(jogoId);
      else next.add(jogoId);
      return next;
    });
  }

  async function handleConfirmarReagendar() {
    const jogosParaReagendar = jogosPendentes.filter(j => !jogosEmAndamento.has(j.id));
    if (jogosParaReagendar.length === 0) {
      toast.error("Nenhum jogo para reagendar! Todos estão marcados como em andamento.");
      return;
    }

    if (!confirm(`Reagendar ${jogosParaReagendar.length} jogos para ${numQuadrasReagenda} quadra(s) a partir das ${horaReagenda}?`)) return;

    const pwd = window.prompt("Digite a senha de segurança para reagendar os jogos:");
    if (pwd !== "740689") {
      toast.error("Senha incorreta. Ação cancelada.");
      return;
    }

    setLoading(true);
    try {
      const idsParaReagendar = jogosParaReagendar.map(j => j.id);
      const res = await fetch("/api/chaveamento/reagendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modalidade: modalidadeReagenda,
          num_quadras: numQuadrasReagenda,
          hora_inicio: horaReagenda,
          jogo_ids: idsParaReagendar
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.reagendados} jogos reagendados com sucesso!`);
        setEtapaChuva("config");
        setJogosPendentes([]);
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

  function formatHora(dateStr: string | null) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  }

    if (view === "home") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="heading-lg">Acesso Gerencial</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Gerencie os campeonatos criados.</p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
          
          {/* Create New Card */}
          <div className="card card-padded" style={{ border: "2px dashed var(--brand-300)", width: "300px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-600)" }}>🆕 Criar Novo Campeonato</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Atenção: Ao criar um novo campeonato, o atual (se houver) será automaticamente arquivado.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">NOME DO CAMPEONATO</label>
                <input type="text" className="input" placeholder="Ex: One Day Vôlei 2026" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">ANO</label>
                <input type="number" className="input" value={ano} onChange={e => setAno(Number(e.target.value))} />
              </div>
              <button onClick={handleCreateChampionship} className="btn btn-primary" disabled={loading || !nome}>
                {loading ? "Criando..." : "✅ Criar Campeonato"}
              </button>
            </div>
          </div>

          {/* List existing ones */}
          {campeonatos.map(camp => (
            <div key={camp.id} className="card card-padded" style={{ border: camp.status === "ativo" ? "2px solid #10b981" : "1px solid #e2e8f0", width: "300px", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <h3 className="heading-md">{camp.nome}</h3>
                {camp.status === "ativo" && <span style={{ background: "#10b981", color: "#fff", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700 }}>ATIVO</span>}
                {camp.status === "arquivado" && <span style={{ background: "#94a3b8", color: "#fff", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700 }}>ARQUIVADO</span>}
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Ano: {camp.ano}</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {camp.status === "ativo" ? (
                  <>
                    <button onClick={() => { setSelectedCamp(camp); setView("painel"); }} className="btn btn-primary" style={{ width: "100%", background: "var(--brand-blue)" }}>
                      ⚙️ Acessar Painel
                    </button>
                    <button onClick={() => handleEncerrarCampeonato(camp.id)} className="btn btn-outline" style={{ width: "100%", borderColor: "var(--red-500)", color: "var(--red-500)" }} disabled={loading}>
                      Encerrar e Tirar do Público
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => window.open("/chaveamento?campeonato_id=" + camp.id, "_blank")} className="btn btn-primary" style={{ width: "100%", background: "#475569", borderColor: "#475569" }}>
                      📊 Ver Histórico
                    </button>
                    <button onClick={() => handleExcluirCampeonato(camp.id)} className="btn btn-outline" style={{ width: "100%", borderColor: "var(--red-500)", color: "var(--red-500)", marginTop: "0.5rem" }} disabled={loading}>
                      🗑️ Excluir Definitivamente
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>
    );
  }

return (
    <div>
      <button onClick={() => setView("home")} className="btn btn-outline" style={{ marginBottom: "1rem" }}>← Voltar para Campeonatos</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 className="heading-lg">Painel do Campeonato</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Controle total sobre o evento.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link href="/placar" className="btn btn-primary" style={{ whiteSpace: "nowrap", background: "#f59e0b", borderColor: "#f59e0b", color: "#fff" }}>🎯 Placar</Link>
          <Link href="/checkin" className="btn btn-primary" style={{ whiteSpace: "nowrap", background: "#10b981", borderColor: "#10b981", color: "#fff" }}>✅ Check-in</Link>
          <Link href="/sumulas" className="btn btn-primary" style={{ whiteSpace: "nowrap", background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" }}>🖨️ Súmulas</Link>
          <Link href="/super-admin/times" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>👥 Times Cadastrados</Link>
          <Link href="/super-admin/auditoria" className="btn btn-outline" style={{ whiteSpace: "nowrap" }}>📋 Auditoria</Link>
        </div>
      </div>

      {!configMod ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          
          {/* Card 0: Modalidades */}
          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px solid #10b981" }}>
            <h3 className="heading-md" style={{ marginBottom: "0.5rem", color: "#10b981" }}>➕ Modalidades do Evento</h3>
            
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <input type="text" className="input" placeholder="Nova (ex: Ping Pong)" value={novaModalidade} onChange={e => setNovaModalidade(e.target.value)} style={{ flex: 1 }} />
              <button onClick={handleAddModalidade} className="btn" style={{ backgroundColor: "#10b981", color: "#fff" }} disabled={loading || !novaModalidade}>
                Add
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {modalidadesOptions.length === 0 && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Nenhuma modalidade cadastrada.</p>}
              {modalidadesOptions.map(m => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", background: "var(--glass-bg)", borderRadius: "0.5rem", border: "1px solid var(--glass-border)" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.nome}</span>
                  <button onClick={() => handleDeleteModalidade(m.id)} style={{ background: "none", border: "none", color: "var(--red-500)", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 1: Botões de Chaveamento */}
          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px solid var(--brand-blue)" }}>
            <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-blue)" }}>🏆 Gerenciar Chaveamentos</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Selecione a modalidade que deseja configurar e gerar os jogos:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {modalidadesOptions.length === 0 && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Adicione modalidades primeiro.</p>}
              {modalidadesOptions.map(m => (
                <button key={m.id} onClick={() => { setModalidade(m.nome); setConfigMod(m.nome); }} className="btn btn-primary" style={{ width: "100%", justifyContent: "space-between" }}>
                  <span>{m.nome}</span>
                  <span>→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Plano de Contingência */}
          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px solid #3b82f6" }}>
            <h3 className="heading-md" style={{ marginBottom: "0.5rem", color: "#3b82f6" }}>🌧️ Plano de Contingência</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Mudou o número de quadras? Realoque os jogos pendentes mantendo a sequência.
            </p>
            
            {etapaChuva === "config" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">MODALIDADE</label>
                  <select className="input" value={modalidadeReagenda} onChange={e => setModalidadeReagenda(e.target.value)}>
                    {modalidadesOptions.length === 0 && <option value="">Carregando...</option>}
                    {modalidadesOptions.map(m => (
                      <option key={m.id} value={m.nome}>{m.nome}</option>
                    ))}
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
                <button onClick={handleCarregarJogosPendentes} className="btn" style={{ width: "100%", backgroundColor: "#3b82f6", color: "#fff" }} disabled={loading || !modalidadeReagenda}>
                  {loading ? "Carregando..." : "🔍 Ver Jogos Pendentes"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{jogosPendentes.length} jogos pendentes</span>
                  <button onClick={() => setEtapaChuva("config")} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem" }}>← Voltar</button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "#fef3c7", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", margin: 0 }}>
                  ⚠️ Marque os jogos que estão <b>ACONTECENDO AGORA</b>. Eles NÃO serão alterados.
                </p>
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {jogosPendentes.map((jogo, idx) => {
                    const isEmAndamento = jogosEmAndamento.has(jogo.id);
                    return (
                      <div key={jogo.id} onClick={() => toggleEmAndamento(jogo.id)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer", border: isEmAndamento ? "2px solid #f59e0b" : "1px solid var(--glass-border)", background: isEmAndamento ? "rgba(245,158,11,0.08)" : "var(--glass-bg)" }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: "0.8rem", fontWeight: 600 }}>
                          Jogo #{jogo.ordem_na_fase}
                        </div>
                        {isEmAndamento && <span style={{ fontSize: "0.65rem", background: "#f59e0b", color: "#fff", padding: "0.125rem 0.5rem", borderRadius: "1rem" }}>EM CAMPO</span>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleConfirmarReagendar} className="btn" style={{ backgroundColor: "#3b82f6", color: "#fff" }} disabled={loading}>
                  🔄 Reagendar
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Simulação de Testes */}
          <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px dashed var(--brand-300)" }}>
            <h3 className="heading-md" style={{ marginBottom: "0.5rem", color: "var(--brand-600)" }}>🧪 Painel de Simulação</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Área reservada para testar geração de times fictícios e placares aleatórios.
            </p>
            <button onClick={() => window.open("/super-admin/simulacao", "_blank")} className="btn btn-outline" style={{ width: "100%", borderColor: "var(--brand-600)", color: "var(--brand-600)" }}>
              Acessar Painel de Simulação ↗
            </button>
          </div>

        </div>
      ) : (
        /* ----- TELA DE CONFIGURAÇÃO DA MODALIDADE ----- */
        <div className="card card-padded" style={{ maxWidth: "800px", margin: "0 auto", border: "2px solid var(--brand-blue)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h3 className="heading-lg" style={{ color: "var(--brand-blue)" }}>⚙️ Configurar: {configMod}</h3>
            <button onClick={() => setConfigMod(null)} className="btn btn-outline">← Voltar</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: (configMod.toLowerCase().includes("futebol") || configMod.toLowerCase().includes("futsal")) ? "1fr 1fr 1fr" : "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
            <div className="input-group">
              <label className="input-label">Nº DE QUADRAS</label>
              <input type="number" className="input" min={1} max={10} value={numQuadras} onChange={e => setNumQuadras(Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label className="input-label">HORÁRIO DO 1º JOGO</label>
              <input type="time" className="input" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
            </div>
            {(configMod.toLowerCase().includes("futebol") || configMod.toLowerCase().includes("futsal")) && (
              <div className="input-group">
                <label className="input-label">TEMPO DE JOGO</label>
                <input type="number" className="input" min={5} max={120} value={tempoJogo} onChange={e => setTempoJogo(Number(e.target.value))} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div style={{ padding: "1.5rem", background: "var(--glass-bg)", borderRadius: "0.5rem", border: "1px solid var(--glass-border)" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>1. Fase de Grupos</h4>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button onClick={handleGenerateBracket} className="btn btn-outline" disabled={loading} style={{ flex: 1, minWidth: "200px" }}>
                  🎲 Sorteio Aleatório
                </button>
                <Link href={`/super-admin/chaveamento-manual?modalidade=${encodeURIComponent(configMod)}`} className="btn btn-outline" style={{ flex: 1, minWidth: "200px", borderColor: "var(--brand-blue)", color: "var(--brand-blue)", textAlign: "center", textDecoration: "none" }}>
                  ✏️ Editar / Configurar Manual
                </Link>
              </div>
            </div>

            <div style={{ padding: "1.5rem", background: "rgba(16, 185, 129, 0.05)", borderRadius: "0.5rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "#10b981" }}>2. Tabela de Jogos (Fase 1)</h4>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button onClick={handleGerarJogos} className="btn btn-primary" disabled={loading} style={{ flex: 1, backgroundColor: "#10b981", borderColor: "#10b981", minWidth: "200px" }}>
                  ⚽ Gerar Tabela Automática
                </button>
                <button onClick={handleClearJogos} className="btn btn-outline" disabled={loading} style={{ flex: 1, borderColor: "var(--red-500)", color: "var(--red-500)", minWidth: "200px" }}>
                  🧹 Limpar Apenas Jogos
                </button>
              </div>
            </div>

            <div style={{ padding: "1.5rem", background: "rgba(245, 158, 11, 0.05)", borderRadius: "0.5rem", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "#f59e0b" }}>3. Mata-Mata</h4>
              <button onClick={handleGerarMataMata} className="btn" disabled={loading} style={{ width: "100%", backgroundColor: "#f59e0b", color: "#fff", borderColor: "#f59e0b" }}>
                🏆 Gerar Eliminatórias (Quartas/Semi/Final)
              </button>
            </div>

            <div style={{ padding: "1.5rem", background: "rgba(139, 92, 246, 0.05)", borderRadius: "0.5rem", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "#8b5cf6" }}>4. Documentos</h4>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <a href={"/imprimir-sumulas/" + encodeURIComponent(configMod)} target="_blank" className="btn btn-primary" style={{ flex: 1, backgroundColor: "#8b5cf6", borderColor: "#8b5cf6", textAlign: "center", textDecoration: "none" }}>
                  🖨️ Súmulas de Jogos
                </a>
                <a href={"/imprimir-chaveamento/" + encodeURIComponent(configMod)} target="_blank" className="btn btn-primary" style={{ flex: 1, backgroundColor: "#6366f1", borderColor: "#6366f1", textAlign: "center", textDecoration: "none" }}>
                  📊 Tabela Geral
                </a>
              </div>
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--glass-border)", textAlign: "center" }}>
              <button onClick={handleClearBracket} className="btn btn-outline" disabled={loading} style={{ borderColor: "var(--red-500)", color: "var(--red-500)" }}>
                🚨 Apagar Tudo (Grupos e Jogos)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
