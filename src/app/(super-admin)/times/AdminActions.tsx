"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AdminActions({ campeonatoId }: { campeonatoId: number }) {
  const [loading, setLoading] = useState("");
  const router = useRouter();

  async function toggleCadastros() {
    setLoading("cadastros");
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggle_cadastros: true }),
      });
      if (!res.ok) { toast.error("Erro ao alterar cadastros."); return; }
      toast.success("Status de cadastros alterado!");
      router.refresh();
    } finally {
      setLoading(""); 
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", padding: "1rem", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)" }}>
      <button id="btn-toggle-cadastros" className="btn btn-ghost btn-sm" onClick={toggleCadastros} disabled={loading === "cadastros"}>
        {loading === "cadastros" ? "..." : "🔒 Abrir/Fechar Cadastros"}
      </button>
    </div>
  );
}
