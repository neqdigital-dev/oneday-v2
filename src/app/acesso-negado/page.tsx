import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AcessoNegadoPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container" style={{ textAlign: "center", padding: "6rem 0" }}>
          <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🚫</div>
          <h1 className="heading-lg" style={{ marginBottom: "1rem" }}>Acesso Negado</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", maxWidth: "400px", margin: "0 auto 2rem" }}>
            Você não tem permissão para acessar esta página.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-primary">← Ir para início</Link>
            <Link href="/painel" className="btn btn-ghost">Ver painel público</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
