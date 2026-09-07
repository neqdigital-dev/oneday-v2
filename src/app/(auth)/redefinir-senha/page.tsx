"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function RedefinirSenha() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) return <div className="card card-padded">Link inválido ou expirado.</div>;

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✅ Senha alterada com sucesso! Redirecionando...");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setMsg("❌ " + data.error);
      }
    } catch (err) {
      setMsg("❌ Erro ao redefinir senha.");
    }
    setLoading(false);
  }

  return (
    <div className="card card-padded-lg animate-fade-in" style={{ width: "100%", maxWidth: "450px" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 className="heading-md">Nova Senha</h1>
        <p style={{ color: "var(--text-secondary)" }}>Digite sua nova senha abaixo</p>
      </div>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="input-group">
          <label className="input-label">NOVA SENHA</label>
          <input type="password" className="input" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
      {msg && <div style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{msg}</div>}
    </div>
  );
}
