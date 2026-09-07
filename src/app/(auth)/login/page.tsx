"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { username, password, redirect: false });
      if (res?.error) {
        toast.error("Usuário ou senha incorretos.");
      } else {
        toast.success("Login realizado!");
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>⚽</div>
          <h1 className="heading-lg">Bem-vindo de volta</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Entre na sua conta OneDay</p>
        </div>

        <div className="card card-padded-lg animate-fade-in">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="input-group">
              <label className="input-label">Usuário</label>
              <input
                id="login-username"
                type="text"
                className="input"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Senha</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button id="login-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar →"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Não tem conta?{" "}
            <Link href="/signup" style={{ color: "var(--brand-400)", fontWeight: "600" }}>Criar conta</Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/painel" style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            Ver painel público sem login →
          </Link>
        </div>
      </div>
    </div>
  );
}

