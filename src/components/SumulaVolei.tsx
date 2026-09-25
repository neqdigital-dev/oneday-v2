import React from 'react';
import { formatDateTime } from "@/lib/utils";

function formatHora(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export default function SumulaVolei({ game, modalidade, nomeCampeonato }: { game: any; modalidade: string; nomeCampeonato: string }) {
  const timeA = game.time_a?.nome_base || game.time_a?.nome_igreja || "A definir";
  const timeB = game.time_b?.nome_base || game.time_b?.nome_igreja || "A definir";

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
                {game.fase}
              </div>
            </div>
          </div>
        </div>

        {/* Teams and Sets Area */}
        <div className="match-area">
          <div className="team-names-row">
            <div className="team-name">{timeA}</div>
            <div className="team-name">{timeB}</div>
          </div>
          
          <div className="sets-row">
            <div className="set-box-col">
              <div className="box-empty"></div>
              <div className="box-empty"></div>
              <div className="box-empty"></div>
              <div className="box-empty"></div>
            </div>
            
            <div className="set-labels-col">
              <div className="set-label-empty"></div>
              <div className="set-label">SET 1</div>
              <div className="set-label">SET 2</div>
              <div className="set-label">SET 3</div>
            </div>
            
            <div className="set-box-col">
              <div className="box-empty"></div>
              <div className="box-empty"></div>
              <div className="box-empty"></div>
              <div className="box-empty"></div>
            </div>
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
          padding: 30px 40px;
          border-bottom: 3px solid black;
        }
        .team-names-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .team-name {
          width: 250px;
          text-align: center;
          border-bottom: 1px solid black;
          font-size: 14px;
        }
        .sets-row {
          display: flex;
          justify-content: center;
          gap: 40px;
        }
        .set-box-col {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .box-empty {
          width: 50px;
          height: 30px;
          border: 2px solid black;
        }
        .set-labels-col {
          display: flex;
          flex-direction: column;
          gap: 15px;
          align-items: center;
          justify-content: center;
        }
        .set-label-empty {
          height: 30px;
        }
        .set-label {
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 16px;
        }
        
        .ocorrencias-area {
          height: 250px;
          border-bottom: 3px solid black;
          padding: 5px;
        }
        .ocorrencias-title {
          font-size: 12px;
        }
        
        .signatures-area {
          padding: 20px 5px 5px 5px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
