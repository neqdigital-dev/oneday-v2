"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("As senhas não coincidem."); return; }
    if (form.password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao criar conta."); return; }
      toast.success("Conta criada! Faça login.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏆</div>
          <h1 className="heading-lg">Criar conta</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Cadastre seu time no OneDay</p>
        </div>

        <div className="card card-padded-lg animate-fade-in">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="input-group">
              <label className="input-label">Nome de usuário</label>
              <input id="signup-username" type="text" className="input" placeholder="ex: igrejacentral" value={form.username} onChange={set("username")} required />
            </div>
            <div className="input-group">
              <label className="input-label">E-mail</label>
              <input id="signup-email" type="email" className="input" placeholder="seu@email.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="input-group">
              <label className="input-label">Senha</label>
              <input id="signup-password" type="password" className="input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set("password")} required />
            </div>
            <div className="input-group">
              <label className="input-label">Confirmar senha</label>
              <input id="signup-confirm" type="password" className="input" placeholder="Repita a senha" value={form.confirm} onChange={set("confirm")} required />
            </div>
            <button id="signup-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta →"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Já tem conta?{" "}
            <Link href="/login" style={{ color: "var(--brand-400)", fontWeight: "600" }}>Fazer login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
