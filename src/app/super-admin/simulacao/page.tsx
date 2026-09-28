import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SimulacaoClient from "./SimulacaoClient";

export default async function SimulacaoPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    redirect("/login");
  }

  return (
    <div className="page-wrapper">
      <main className="page-content">
        <div className="container">
          <div style={{ marginBottom: "2rem" }}>
            <a href="/super-admin/dashboard" className="btn btn-outline" style={{ marginBottom: "1rem", display: "inline-block" }}>← Voltar para Dashboard</a>
            <h1 className="heading-lg">Painel de Simulação</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              Gere times fictícios e placares aleatórios para testar o sistema.
            </p>
          </div>
          <SimulacaoClient />
        </div>
      </main>
    </div>
  );
}
