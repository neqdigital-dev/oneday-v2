"use client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteJogadorBtn({ jogadorId, timeId }: { jogadorId: number; timeId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este jogador?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jogadores/${jogadorId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Erro ao excluir jogador."); return; }
      toast.success("Jogador excluído.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loading}>
      {loading ? "..." : "Excluir"}
    </button>
  );
}
