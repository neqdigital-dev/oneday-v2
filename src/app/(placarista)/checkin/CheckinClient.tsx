"use client";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CheckinClient({ times }: { times: any[] }) {
  const modalidades = useMemo(() => {
    return Array.from(new Set(times.map(t => t.modalidade).filter(Boolean)));
  }, [times]);

  const [selectedMod, setSelectedMod] = useState<string>(modalidades[0] || "");
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  // Guardar estado local dos jogadores para atualizar a UI instantaneamente
  const [localJogadores, setLocalJogadores] = useState<Record<string, boolean>>({});

  const teamsForMod = times.filter(t => t.modalidade === selectedMod);

  // Inicializa o state local com o state do banco (assumindo que a coluna check_in vem do BD)
  // Como o usuário foi encarregado de adicionar a coluna, vamos tratar undefined como false.
  const handleToggleCheckin = async (jogador: any) => {
    const isChecked = localJogadores[jogador.id] !== undefined ? localJogadores[jogador.id] : (jogador.check_in || false);
    const newVal = !isChecked;
    
    // Otimista
    setLocalJogadores(prev => ({ ...prev, [jogador.id]: newVal }));

    try {
      const res = await fetch("/api/jogadores/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jogador.id, check_in: newVal })
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar o check-in");
        // Reverte
        setLocalJogadores(prev => ({ ...prev, [jogador.id]: !newVal }));
      }
    } catch (e) {
      toast.error("Erro interno");
      setLocalJogadores(prev => ({ ...prev, [jogador.id]: !newVal }));
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "40px" }}>
      {/* HEADER SIMPLES PARA NAVEGAÇÃO DO PLACARISTA */}
      <header style={{ background: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", color: "var(--brand-600, #2563eb)" }}>
          Área do Placarista
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/placar" style={{ padding: "8px 16px", borderRadius: "6px", background: "#e2e8f0", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
            Gerenciar Placar
          </Link>
          <Link href="/checkin" style={{ padding: "8px 16px", borderRadius: "6px", background: "var(--brand-500, #3b82f6)", color: "white", textDecoration: "none", fontWeight: 600 }}>
            Fazer Check-in
          </Link>
          <Link href="/sumulas" style={{ padding: "8px 16px", borderRadius: "6px", background: "#e2e8f0", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
            Súmulas
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "30px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Check-in de Jogadores</h2>

        {/* MODALIDADES */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          {modalidades.map(m => (
            <button
              key={m}
              onClick={() => { setSelectedMod(m); setSelectedTeam(null); }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                background: selectedMod === m ? "var(--brand-500, #3b82f6)" : "white",
                color: selectedMod === m ? "white" : "#475569",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* TIMES */}
        {!selectedTeam ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
            {teamsForMod.map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTeam(t)}
                style={{
                  background: "white", padding: "20px", borderRadius: "10px", cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px"
                }}
              >
                <img src={t.imagem_url || "/logo.png"} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ fontWeight: "bold", textAlign: "center" }}>{t.nome_base || t.nome_igreja}</span>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{t.jogadores?.length || 0} jogadores</span>
              </div>
            ))}
            {teamsForMod.length === 0 && <p>Nenhum time nesta modalidade.</p>}
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <button 
              onClick={() => setSelectedTeam(null)} 
              style={{ background: "transparent", border: "none", color: "var(--brand-500, #3b82f6)", cursor: "pointer", fontWeight: "bold", marginBottom: "20px", padding: 0 }}
            >
              ← Voltar para Times
            </button>
            
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
              <img src={selectedTeam.imagem_url || "/logo.png"} alt="" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.4rem" }}>{selectedTeam.nome_base || selectedTeam.nome_igreja}</h3>
                <span style={{ color: "#64748b" }}>{selectedTeam.distrito}</span>
              </div>
            </div>

            {(!selectedTeam.jogadores || selectedTeam.jogadores.length === 0) ? (
              <p style={{ color: "#64748b" }}>Nenhum jogador cadastrado neste time.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedTeam.jogadores.map((j: any) => {
                  const isChecked = localJogadores[j.id] !== undefined ? localJogadores[j.id] : (j.check_in || false);
                  return (
                    <div 
                      key={j.id} 
                      onClick={() => handleToggleCheckin(j)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center", 
                        padding: "15px", borderRadius: "8px", cursor: "pointer",
                        border: isChecked ? "2px solid #10b981" : "1px solid #e2e8f0",
                        background: isChecked ? "#ecfdf5" : "transparent",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "bold", color: isChecked ? "#065f46" : "#1e293b" }}>{j.nome_completo}</span>
                        <span style={{ fontSize: "0.85rem", color: isChecked ? "#047857" : "#64748b" }}>CPF: {j.cpf || "Não informado"}</span>
                      </div>
                      <div style={{ fontSize: "1.5rem", color: isChecked ? "#10b981" : "#cbd5e1" }}>
                        {isChecked ? "✅" : "⚪"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
