"use client";
import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setMsg("✅ " + data.message);
      else setMsg("❌ " + data.error);
    } catch (err) {
      setMsg("❌ Erro ao enviar solicitação.");
    }
    setLoading(false);
  }

  return (
    <div className="card card-padded-lg animate-fade-in" style={{ width: "100%", maxWidth: "450px" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img src="/logo.png" alt="OneDay" style={{ height: "60px", marginBottom: "1rem", objectFit: "contain" }} />
        <h1 className="heading-md">Recuperar Senha</h1>
        <p style={{ color: "var(--text-secondary)" }}>Digite seu e-mail cadastrado</p>
      </div>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="input-group">
          <label className="input-label">E-MAIL</label>
          <input type="email" className="input" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>
      {msg && <div style={{ marginTop: "1rem", textAlign: "center", fontWeight: "bold" }}>{msg}</div>}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link href="/login" style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>← Voltar para o Login</Link>
      </div>
    </div>
  );
}
