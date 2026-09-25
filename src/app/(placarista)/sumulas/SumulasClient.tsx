"use client";
import { useState } from "react";
import Link from "next/link";
import { FaPrint, FaChevronRight } from "react-icons/fa";

type SumulasData = {
  modalidade: string;
  fases: string[];
};

export default function SumulasClient({ data }: { data: SumulasData[] }) {
  const [selectedMod, setSelectedMod] = useState<string | null>(null);

  const modData = data.find(d => d.modalidade === selectedMod);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "40px" }}>
      {/* HEADER SIMPLES PARA NAVEGAÇÃO DO PLACARISTA */}
      <header style={{ background: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexWrap: "wrap", gap: "10px" }}>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", color: "var(--brand-600, #2563eb)" }}>
          Área do Placarista
        </h1>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/placar" style={{ padding: "8px 16px", borderRadius: "6px", background: "#e2e8f0", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
            Gerenciar Placar
          </Link>
          <Link href="/checkin" style={{ padding: "8px 16px", borderRadius: "6px", background: "#e2e8f0", color: "#1e293b", textDecoration: "none", fontWeight: 600 }}>
            Fazer Check-in
          </Link>
          <Link href="/sumulas" style={{ padding: "8px 16px", borderRadius: "6px", background: "var(--brand-500, #3b82f6)", color: "white", textDecoration: "none", fontWeight: 600 }}>
            Súmulas
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "30px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Impressão de Súmulas</h2>

        {/* MODALIDADES */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          {data.map(m => (
            <button
              key={m.modalidade}
              onClick={() => setSelectedMod(m.modalidade)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                background: selectedMod === m.modalidade ? "var(--brand-500, #3b82f6)" : "white",
                color: selectedMod === m.modalidade ? "white" : "#475569",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              {m.modalidade}
            </button>
          ))}
        </div>

        {/* FASES DA MODALIDADE SELECIONADA */}
        {selectedMod && modData && (
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.2rem", color: "#1e293b" }}>Selecione a Fase para Imprimir ({selectedMod}):</h3>
            
            {modData.fases.length === 0 ? (
              <p style={{ color: "#64748b" }}>Nenhum jogo gerado para esta modalidade ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {modData.fases.map(fase => (
                  <a 
                    key={fase}
                    href={`/imprimir-sumulas/${encodeURIComponent(selectedMod)}?fase=${encodeURIComponent(fase)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", 
                      padding: "15px", borderRadius: "8px", cursor: "pointer",
                      border: "1px solid #e2e8f0", background: "transparent",
                      textDecoration: "none", color: "#1e293b", transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FaPrint style={{ color: "var(--brand-500, #3b82f6)" }} />
                      <span style={{ fontWeight: "bold" }}>Súmulas - {fase}</span>
                    </div>
                    <FaChevronRight style={{ color: "#cbd5e1" }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!selectedMod && data.length > 0 && (
          <p style={{ color: "#64748b", textAlign: "center", marginTop: "40px" }}>
            Selecione uma modalidade acima para ver as opções de impressão.
          </p>
        )}
      </main>
    </div>
  );
}
