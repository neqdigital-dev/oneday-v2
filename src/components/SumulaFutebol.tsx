import React from 'react';
import { formatDateTime } from "@/lib/utils";

function formatHora(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export default function SumulaFutebol({ game, modalidade, nomeCampeonato, jogadoresA, jogadoresB }: { game: any; modalidade: string; nomeCampeonato: string; jogadoresA: any[]; jogadoresB: any[] }) {
  const timeA = game.time_a?.nome_base || game.time_a?.nome_igreja || "A definir";
  const timeB = game.time_b?.nome_base || game.time_b?.nome_igreja || "A definir";

  // Preencher a tabela para sempre ter umas 12 linhas, para ocupar espaço
  const maxRows = Math.max(12, jogadoresA.length, jogadoresB.length);
  const rows = [];
  for (let i = 0; i < maxRows; i++) {
    rows.push({
      atletaA: jogadoresA[i]?.nome_completo?.toUpperCase() || "",
      atletaB: jogadoresB[i]?.nome_completo?.toUpperCase() || "",
    });
  }

  return (
    <div className="sumula-page">
      <div className="outer-border">
        {/* Header */}
        <div className="header-box">
          <div className="header-title">
            FICHA TÉCNICA - {modalidade.toUpperCase()} - {nomeCampeonato.toUpperCase()} - #JOGO {game.ordem_na_fase || "?"}
          </div>
          
          <div className="header-info">
            <div className="info-left">
              <div className="info-row">
                <span className="info-label">HORÁRIO INICIO:</span>
                <span className="info-value">{game.data_hora ? formatHora(game.data_hora) : ""}</span>
              </div>
              <div className="info-row">
                <span className="info-label">HORÁRIO FINAL:</span>
                <span className="info-value"></span>
              </div>
              <div className="info-row">
                <span className="info-label">DELEGADO DA PARTIDA:</span>
                <span className="info-value"></span>
              </div>
            </div>
            <div className="info-right">
              <div className="grupo-box">
                {game.local ? `CAMPO ${game.local}` : "CAMPO __"}
              </div>
            </div>
          </div>
        </div>

        {/* Match Area */}
        <div className="match-area">
          {/* Teams Header */}
          <div className="teams-header">
            <div className="team-box-name">{timeA}</div>
            <div className="score-box-small"></div>
            <div className="vs-text">X</div>
            <div className="score-box-small"></div>
            <div className="team-box-name">{timeB}</div>
          </div>
          
          <div className="faltas-row">
            <div className="faltas-text">No. FALTAS: ①②③④⑤</div>
            <div className="faltas-text">No. FALTAS: ①②③④⑤</div>
          </div>
          
          <div className="table-container">
            <div className="vertical-rodada">
              {(game.fase === 'Fase de Grupos' ? 'GRUPOS' : game.fase === 'Quartas de Final' ? 'QUARTAS' : game.fase === 'Semifinal' ? 'SEMI' : 'FINAL').split('').map((char: string, i: number) => (
                <div key={i}>{char}</div>
              ))}
            </div>
            
            <table className="players-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>ATLETA</th>
                  <th style={{ width: "7%" }}>CARTÕES</th>
                  <th style={{ width: "5%" }}>GOL</th>
                  <th style={{ width: "6%" }}></th>
                  <th style={{ width: "5%" }}>GOL</th>
                  <th style={{ width: "7%" }}>CARTÕES</th>
                  <th style={{ width: "35%" }}>ATLETA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="atleta-td">{row.atletaA}</td>
                    <td></td>
                    <td></td>
                    <td style={{ borderTop: "none", borderBottom: "none", backgroundColor: "#fff" }}></td>
                    <td></td>
                    <td></td>
                    <td className="atleta-td">{row.atletaB}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", fontWeight: "bold" }}>TOTAL</td>
                  <td></td>
                  <td style={{ borderTop: "none", borderBottom: "none", backgroundColor: "#fff" }}>X</td>
                  <td></td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Ocorrências */}
        <div className="ocorrencias-area">
          <div className="ocorrencias-title">OCORRÊNCIAS:</div>
        </div>

        {/* Signatures */}
        <div className="signatures-area">
          <div className="signature-line">
            ASSINATURA DO DELEGADO DA PARTIDA: ____________________________________________________
          </div>
          <div className="signature-line">
            ASSINATURA DO CAPITÃO 1: ________________________________________________________________
          </div>
          <div className="signature-line">
            ASSINATURA DO CAPITÃO 2: ________________________________________________________________
          </div>
        </div>
      </div>

      <style>{`
        .sumula-page {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          height: 1060px; /* Fixed height instead of 100vh to avoid notebook overflow */
          padding: 20px;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          page-break-after: always;
        }
        .outer-border {
          border: 3px solid black;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .header-box {
          border-bottom: 3px solid black;
        }
        .header-title {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          padding: 5px;
          border-bottom: 2px solid black;
        }
        .header-info {
          display: flex;
          padding: 10px;
        }
        .info-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .info-row {
          display: flex;
        }
        .info-label {
          width: 200px;
          border: 1px solid black;
          padding: 3px 5px;
          font-weight: bold;
          font-size: 14px;
        }
        .info-value {
          width: 150px;
          border: 1px solid black;
          border-left: none;
          padding: 3px 5px;
        }
        .info-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 20px;
        }
        .grupo-box {
          border: 2px solid black;
          padding: 5px 30px;
          font-weight: bold;
          font-size: 16px;
        }
        
        .match-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20px;
          border-bottom: 3px solid black;
        }
        .teams-header {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin-bottom: 5px;
        }
        .team-box-name {
          width: 250px;
          border: 2px solid black;
          text-align: center;
          padding: 5px;
          font-size: 14px;
          font-weight: bold;
        }
        .score-box-small {
          width: 40px;
          height: 30px;
          border: 2px solid black;
        }
        .vs-text {
          font-size: 18px;
          font-weight: bold;
        }
        
        .faltas-row {
          display: flex;
          justify-content: space-between;
          padding: 0 40px;
          margin-bottom: 10px;
        }
        .faltas-text {
          border: 1px solid black;
          padding: 2px 10px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .table-container {
          display: flex;
          flex: 1;
        }
        .vertical-rodada {
          width: 30px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 24px;
          font-weight: bold;
          padding-right: 5px;
        }
        .players-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid black;
        }
        .players-table th, .players-table td {
          border: 1px solid black;
          text-align: center;
          padding: 3px;
          font-size: 11px;
        }
        .atleta-td {
          text-align: left !important;
          padding-left: 5px !important;
        }
        
        .ocorrencias-area {
          height: 100px;
          border-bottom: 3px solid black;
          padding: 5px;
        }
        .ocorrencias-title {
          font-size: 12px;
        }
        
        .signatures-area {
          padding: 10px 5px 5px 5px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
