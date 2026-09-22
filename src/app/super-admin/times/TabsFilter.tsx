"use client";

import { useState } from "react";
import Link from "next/link";

export default function TabsFilter({ times }: { times: any[] }) {
  const [activeTab, setActiveTab] = useState("Todos");

  const modalidades = ["Todos", "Futebol Masculino", "Futebol Feminino", "Vôlei Masculino", "Vôlei Feminino", "Tênis de Mesa"];

  const filteredTimes = activeTab === "Todos" ? times : times.filter(t => t.modalidade === activeTab);

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        {modalidades.map(mod => (
          <button
            key={mod}
            onClick={() => setActiveTab(mod)}
            className={`btn btn-sm ${activeTab === mod ? "btn-primary" : "btn-ghost"}`}
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {mod}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Time</th><th>Modalidade</th><th>Jogadores</th><th>Pagamento</th><th>Cadastros</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {filteredTimes.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Nenhum time cadastrado nesta modalidade.</td></tr>
            )}
            {filteredTimes.map((time: any) => (
              <tr key={time.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {time.imagem_url && <img src={time.imagem_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />}
                    <div>
                      <div style={{ fontWeight: "600" }}>{time.nome_base || time.nome_igreja}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{time.nome_igreja}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${time.modalidade === "Futebol Masculino" ? "badge-blue" : time.modalidade === "Futebol Feminino" ? "badge-pink" : "badge-orange"}`} style={{ fontSize: "0.7rem" }}>{time.modalidade}</span>
                </td>
                <td>{time.jogadores?.length || 0}</td>
                <td>
                  <span className={`badge ${time.pagou ? "badge-green" : "badge-red"}`} style={{ fontSize: "0.7rem" }}>
                    {time.pagou ? "ã Pago" : "⎔ Pendente"}
                  </span>
                </td>
                <td>
                  <span className={`badge ${time.cadastros_encerrados ? "badge-gray" : "badge-green"}`} style={{ fontSize: "0.7rem" }}>
                    {time.cadastros_encerrados ? "Encerrado" : "Aberto"}
                  </span>
                </td>
                <td>
                  <Link href={`/time/${time.id}`} className="btn btn-ghost btn-sm">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
