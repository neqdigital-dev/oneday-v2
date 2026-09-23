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
  
  const [modalidadesOptions, setModalidadesOptions] = useState<any[]>([]);
  const [novaModalidade, setNovaModalidade] = useState("");

  const [modalidade, setModalidade] = useState("");
  const [numQuadras, setNumQuadras] = useState(2);
  const [horaInicio, setHoraInicio] = useState("08:30");
  
  const [qtdTimes, setQtdTimes] = useState(8);

  // Plano de chuva state
  const [modalidadeReagenda, setModalidadeReagenda] = useState("");
  const [numQuadrasReagenda, setNumQuadrasReagenda] = useState(1);
  const [horaReagenda, setHoraReagenda] = useState("10:30");
  const [jogosPendentes, setJogosPendentes] = useState<any[]>([]);
  const [jogosEmAndamento, setJogosEmAndamento] = useState<Set<string>>(new Set());
  const [etapaChuva, setEtapaChuva] = useState<"config" | "selecao">("config");

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
  }, []);

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
        body: JSON.stringify({ modalidade, num_quadras: numQuadras, hora_inicio: horaInicio })
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 className="heading-lg">Painel do Super Admin</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Controle total sobre o campeonato.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/super-admin/times" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>👥 Ver Times Cadastrados</Link>
          <Link href="/super-admin/auditoria" className="btn btn-outline" style={{ whiteSpace: "nowrap" }}>📋 Log de Auditoria</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Card 0: Modalidades */}
        <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px solid #10b981" }}>
          <h3 className="heading-md" style={{ marginBottom: "0.5rem", color: "#10b981" }}>➕ Gerenciar Modalidades</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", flex: 1 }}>
            Adicione esportes dinamicamente. Eles aparecerão em todas as telas (para Líderes, Placaristas e Simulação).
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">NOME DA MODALIDADE</label>
              <input type="text" className="input" placeholder="Ex: Vôlei de Dupla Feminino" value={novaModalidade} onChange={e => setNovaModalidade(e.target.value)} />
            </div>
            <button onClick={handleAddModalidade} className="btn" style={{ width: "100%", backgroundColor: "#10b981", color: "#fff" }} disabled={loading || !novaModalidade}>
              {loading ? "Adicionando..." : "✅ Adicionar Modalidade"}
            </button>
          </div>
        </div>

        {/* Card 1: Chaveamento */}
        <div className="card card-padded" style={{ display: "flex", flexDirection: "column" }}>
          <h3 className="heading-md" style={{ marginBottom: "1rem", color: "var(--brand-blue, #0D2644)" }}>⚽ Controle de Chaveamento</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">MODALIDADE GERAL</label>
              <select className="input" value={modalidade} onChange={e => setModalidade(e.target.value)}>
                {modalidadesOptions.length === 0 && <option value="">Carregando...</option>}
                {modalidadesOptions.map(m => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
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

            <div style={{ padding: "1rem", background: "var(--glass-bg, #f8fafc)", borderRadius: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--glass-border, #e2e8f0)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>PASSO 1: DEFINIR GRUPOS</span>
              <button onClick={handleGenerateBracket} className="btn btn-outline" disabled={loading || !modalidade} style={{ width: "100%" }}>
                {loading ? "Sorteando..." : "🎲 Sortear Grupos Aleatórios"}
              </button>
              <Link href="/super-admin/chaveamento-manual" className="btn btn-outline" style={{ width: "100%", borderColor: "var(--brand-blue)", color: "var(--brand-blue)", textAlign: "center", textDecoration: "none" }}>
                ⚙️ Ou Configurar Grupos Manualmente
              </Link>
            </div>

            <div style={{ padding: "1rem", background: "rgba(16, 185, 129, 0.05)", borderRadius: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981" }}>PASSO 2: GERAR JOGOS</span>
              <button onClick={handleGerarJogos} className="btn btn-primary" disabled={loading || !modalidade} style={{ width: "100%", backgroundColor: "#10b981", borderColor: "#10b981" }}>
                {loading ? "Gerando..." : "⚽ Gerar Tabela de Jogos"}
              </button>
            </div>

            <button onClick={handleClearBracket} className="btn btn-outline" disabled={loading || !modalidade} style={{ width: "100%", borderColor: "var(--red-500)", color: "var(--red-500)", marginTop: "0.5rem" }}>
              🗑️ Apagar Tudo (Grupos e Jogos)
            </button>
          </div>
        </div>

        {/* Card 2: Plano de Chuva (Reagendamento) - REDESENHADO */}
        <div className="card card-padded" style={{ display: "flex", flexDirection: "column", border: "2px solid #3b82f6" }}>
          <h3 className="heading-md" style={{ marginBottom: "0.5rem", color: "#3b82f6" }}>🌧️ Plano de Chuva (Reagendar)</h3>
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
                ⚠️ Marque os jogos que estão <b>ACONTECENDO AGORA</b>. Eles NÃO serão alterados. Todos os outros serão reagendados para {numQuadrasReagenda} quadra(s) a partir das {horaReagenda}.
              </p>

              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "0.25rem" }}>
                {jogosPendentes.map((jogo, idx) => {
                  const nomeA = jogo.time_a?.nome_base || jogo.time_a?.nome_igreja || "Time A";
                  const nomeB = jogo.time_b?.nome_base || jogo.time_b?.nome_igreja || "Time B";
                  const isEmAndamento = jogosEmAndamento.has(jogo.id);
                  return (
                    <div 
                      key={jogo.id} 
                      onClick={() => toggleEmAndamento(jogo.id)}
                      style={{ 
                        display: "flex", alignItems: "center", gap: "0.75rem", 
                        padding: "0.625rem 0.75rem", borderRadius: "0.625rem", cursor: "pointer",
                        border: isEmAndamento ? "2px solid #f59e0b" : "1px solid var(--glass-border, #e5e7eb)",
                        background: isEmAndamento ? "rgba(245,158,11,0.08)" : "var(--glass-bg, #fff)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ 
                        width: "22px", height: "22px", borderRadius: "0.375rem", flexShrink: 0,
                        border: isEmAndamento ? "2px solid #f59e0b" : "2px solid #d1d5db",
                        background: isEmAndamento ? "#f59e0b" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "0.75rem", fontWeight: 700
                      }}>
                        {isEmAndamento && "⏳"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, display: "flex", gap: "0.375rem", alignItems: "center" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nomeA}</span>
                          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>vs</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nomeB}</span>
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                          #{jogo.ordem_na_fase || idx+1} • {formatHora(jogo.data_hora)} • {jogo.local || "—"}
                        </div>
                      </div>
                      {isEmAndamento && (
                        <span style={{ fontSize: "0.65rem", background: "#f59e0b", color: "#fff", padding: "0.125rem 0.5rem", borderRadius: "1rem", fontWeight: 700, flexShrink: 0 }}>
                          EM CAMPO
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button 
                  onClick={handleConfirmarReagendar} 
                  className="btn" 
                  style={{ flex: 1, backgroundColor: "#3b82f6", color: "#fff" }} 
                  disabled={loading}
                >
                  {loading ? "Processando..." : `🔄 Reagendar ${jogosPendentes.length - jogosEmAndamento.size} jogos`}
                </button>
              </div>
            </div>
          )}
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

            <button onClick={handleGerarTimes} className="btn btn-success" disabled={loading || !modalidade} style={{ width: "100%" }}>
              1. Criar {qtdTimes} times falsos
            </button>
            <button onClick={handleSimularPlacares} className="btn btn-warning" disabled={loading || !modalidade} style={{ width: "100%", color: "#000" }}>
              3. Simular Resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
