import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/types";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    const role = (session.user as any).role as UserRole;
    if (role === "super_admin") redirect("/super-admin/dashboard");
    if (role === "admin") redirect("/admin/painel-admin");
    if (role === "placarista") redirect("/placar");
    redirect("/meus-times");
  }

  return (
    <div className="page-wrapper">
      {/* Navbar pública */}
      <nav className="navbar">
        <div className="container navbar-inner">
          <span className="navbar-logo">⚽ OneDay</span>
          <div className="navbar-links">
            <Link href="/painel" className="navbar-link">Painel</Link>
            <Link href="/chaveamento" className="navbar-link">Chaveamento</Link>
            <Link href="/login" className="btn btn-ghost btn-sm">Entrar</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="page-content">
        <div className="container" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ display: "inline-flex", gap: "0.5rem", padding: "0.375rem 1rem", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "9999px", fontSize: "0.875rem", color: "#60a5fa", marginBottom: "0.5rem" }}>
              🏆 Sistema Oficial de Campeonatos
            </div>

            <h1 className="heading-xl">
              <span className="text-gradient">OneDay</span>
              <br />
              Campeonato
            </h1>

            <p style={{ maxWidth: "520px", color: "var(--text-secondary)", fontSize: "1.125rem", lineHeight: "1.7" }}>
              Gerencie times, jogadores, grupos e chaveamentos de campeonatos esportivos adventistas de forma simples e profissional.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Cadastrar meu time →
              </Link>
              <Link href="/painel" className="btn btn-ghost btn-lg">
                Ver painel público
              </Link>
            </div>
          </div>

          {/* Features */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginTop: "6rem" }}>
            {[
              { icon: "⚽", title: "Múltiplas Modalidades", desc: "Futebol Masculino, Feminino e Vôlei Misto em um único sistema." },
              { icon: "📊", title: "Chaveamento Automático", desc: "Sorteio de grupos e geração de jogos com um clique." },
              { icon: "🏆", title: "Multi-Campeonato", desc: "Crie novas edições do campeonato preservando o histórico." },
              { icon: "📱", title: "Acesso Público", desc: "Qualquer pessoa pode ver o painel, grupos e resultados." },
            ].map((f) => (
              <div key={f.title} className="card card-padded animate-fade-in" style={{ textAlign: "left" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
                <h3 className="heading-sm" style={{ marginBottom: "0.5rem" }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--glass-border)", padding: "1.5rem 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
        <div className="container">
          OneDay Campeonato · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}
