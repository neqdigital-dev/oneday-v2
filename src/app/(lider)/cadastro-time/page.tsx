"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const LINK_PAGAMENTO = "https://eventodaigreja.com.br/ILRJ81";

export default function CadastroTimePage() {
  const [form, setForm] = useState({
    nome_igreja: "", distrito: "", regiao: "", nome_base: "",
    modalidade: "", diretor_jovem: "", pagou: false,
  });
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [comproFile, setComproFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [regioes, setRegioes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/regioes").then(r => r.json()).then(setRegioes).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Erro no upload"); return null; }
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_igreja || !form.modalidade) { toast.error("Nome da igreja e modalidade são obrigatórios."); return; }
    setLoading(true);
    try {
      let imagem_url = null, comprovante_url = null;
      if (imagemFile) imagem_url = await uploadFile(imagemFile, "logos");
      if (comproFile) comprovante_url = await uploadFile(comproFile, "comprovantes");

      const res = await fetch("/api/times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imagem_url, comprovante_url, link_pagamento: LINK_PAGAMENTO }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao cadastrar time."); return; }
      toast.success("Time cadastrado com sucesso!");
      router.push(`/time/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container-md">
          <div style={{ marginBottom: "2rem" }}>
            <h1 className="heading-lg">Cadastrar Time</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Preencha os dados do seu time para participar do campeonato.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h2 className="heading-sm" style={{ marginBottom: "1.25rem" }}>📋 Dados do Time</h2>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Nome da Igreja *</label>
                  <input id="nome_igreja" type="text" className="input" placeholder="Ex: Igreja Adventista Central" value={form.nome_igreja} onChange={set("nome_igreja")} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Nome da Base / Equipe</label>
                  <input id="nome_base" type="text" className="input" placeholder="Ex: Thunder FC" value={form.nome_base} onChange={set("nome_base")} />
                </div>
                <div className="input-group">
                  <label className="input-label">Modalidade *</label>
                  <select id="modalidade" className="input" value={form.modalidade} onChange={set("modalidade")} required>
                    <option value="">Selecione...</option>
                    <option>Futebol Masculino</option>
                    <option>Futebol Feminino</option>
                    <option>Volei Misto</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Distrito</label>
                  <input id="distrito" type="text" className="input" placeholder="Ex: Distrito 1" value={form.distrito} onChange={set("distrito")} />
                </div>
                <div className="input-group">
                  <label className="input-label">Região</label>
                  <select id="regiao" className="input" value={form.regiao} onChange={set("regiao")}>
                    <option value="">Selecione...</option>
                    {regioes.map((r: any) => <option key={r.id} value={r.nome}>{r.nome}{r.descricao ? ` — ${r.descricao}` : ""}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Diretor Jovem</label>
                  <input id="diretor_jovem" type="text" className="input" placeholder="Nome do Diretor Jovem" value={form.diretor_jovem} onChange={set("diretor_jovem")} />
                </div>
              </div>
            </div>

            <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h2 className="heading-sm" style={{ marginBottom: "1.25rem" }}>💰 Pagamento</h2>
              <div style={{ padding: "1rem", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>Acesse o link de pagamento abaixo e após confirmar, marque a opção e faça upload do comprovante.</p>
                <a href={LINK_PAGAMENTO} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Acessar link de pagamento →</a>
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label className="input-label" style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }}>
                    <input id="pagou" type="checkbox" checked={form.pagou} onChange={set("pagou")} style={{ width: "18px", height: "18px", accentColor: "var(--brand-500)" }} />
                    Pagamento confirmado
                  </label>
                </div>
                <div className="input-group">
                  <label className="input-label">Comprovante de pagamento</label>
                  <input id="comprovante" type="file" className="input" accept="image/*,application/pdf" onChange={e => setComproFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>

            <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h2 className="heading-sm" style={{ marginBottom: "1.25rem" }}>🖼️ Logo / Foto do Time</h2>
              <div className="file-upload" onClick={() => document.getElementById("imagem-input")?.click()}>
                <input id="imagem-input" type="file" accept="image/*" onChange={e => {
                  const f = e.target.files?.[0] || null;
                  setImagemFile(f);
                  if (f) setImagemPreview(URL.createObjectURL(f));
                }} style={{ display: "none" }} />
                {imagemPreview ? (
                  <img src={imagemPreview} alt="Preview" style={{ maxHeight: "120px", borderRadius: "var(--radius-md)", margin: "0 auto" }} />
                ) : (
                  <>
                    <div className="file-upload-icon">📸</div>
                    <div className="file-upload-text">Clique para selecionar uma imagem</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>PNG, JPG, GIF até 5MB</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
              <button id="submit-time" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar time →"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
