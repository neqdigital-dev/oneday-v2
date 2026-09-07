import Link from "next/link";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="page-wrapper" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 70px)", padding: "2rem" }}>
        
        <div className="card card-padded-lg animate-fade-in" style={{ maxWidth: "500px", width: "100%", textAlign: "center", borderTop: "6px solid var(--brand-orange)" }}>
          
          <img src="/logo.png" alt="OneDay Logo" style={{ maxWidth: "250px", margin: "0 auto 2rem", display: "block" }} />
          
          <h1 className="heading-md" style={{ marginBottom: "0.5rem" }}>Bem-vindo ao OneDay</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Acompanhe os resultados em tempo real ou acesse a área restrita.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/chaveamento" className="btn btn-primary btn-lg btn-block" style={{ fontSize: "1.125rem", padding: "1rem" }}>
              🏆 Ver Chaveamento Público
            </Link>
            
            <div style={{ display: "flex", alignItems: "center", margin: "1rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }}></div>
              <span style={{ padding: "0 1rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase" }}>Acesso Restrito</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border)" }}></div>
            </div>

            {session ? (
              <Link href="/meus-times" className="btn btn-ghost btn-lg btn-block">
                Acessar Painel (Logado)
              </Link>
            ) : (
              <Link href="/login" className="btn btn-ghost btn-lg btn-block">
                Login / Acesso Líder
              </Link>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
