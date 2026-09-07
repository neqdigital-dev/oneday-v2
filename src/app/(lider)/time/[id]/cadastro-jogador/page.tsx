"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function CadastroJogadorPage() {
  const params = useParams();
  const timeId = params.id as string;
  const [time, setTime] = useState<any>(null);
  const [form, setForm] = useState({
    nome_completo: "", telefone: "", cpf: "", rg: "",
    data_nascimento: "", is_adventista: true, is_capitao: false,
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [identFile, setIdentFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/times/${timeId}`).then(r => r.json()).then(setTime).catch(() => {});
  }, [timeId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

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
    if (!form.nome_completo || !form.telefone || !form.data_nascimento) {
      toast.error("Nome, telefone e data de nascimento são obrigatórios."); return;
    }
    setLoading(true);
    try {
      let foto_url = null, foto_identidade_url = null;
      if (fotoFile) foto_url = await uploadFile(fotoFile, "fotos");
      if (identFile) foto_identidade_url = await uploadFile(identFile, "identidades");

      const res = await fetch("/api/jogadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, time_id: parseInt(timeId), foto_url, foto_identidade_url }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao cadastrar jogador."); return; }
      toast.success("Jogador cadastrado!");
      router.push(`/time/${timeId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container-sm">
          <div style={{ marginBottom: "2rem" }}>
            <h1 className="heading-lg">Cadastrar Jogador</h1>
            {time && <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{time.nome_base || time.nome_igreja} — {time.modalidade}</p>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h2 className="heading-sm" style={{ marginBottom: "1.25rem" }}>👤 Dados Pessoais</h2>
              <div className="form-grid form-grid-2">
                <div className="input-group" style={{ gridColumn: "span 2" }}>
                  <label className="input-label">Nome Completo *</label>
                  <input id="nome_completo" type="text" className="input" placeholder="Nome completo do jogador" value={form.nome_completo} onChange={set("nome_completo")} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Telefone *</label>
                  <input id="telefone" type="tel" className="input" placeholder="(XX) XXXXX-XXXX" value={form.telefone} onChange={set("telefone")} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Data de Nascimento *</label>
                  <input id="data_nascimento" type="date" className="input" value={form.data_nascimento} onChange={set("data_nascimento")} required />
                </div>
                <div className="input-group">
                  <label className="input-label">CPF</label>
                  <input id="cpf" type="text" className="input" placeholder="000.000.000-00" value={form.cpf} onChange={set("cpf")} />
                </div>
                <div className="input-group">
                  <label className="input-label">RG</label>
                  <input id="rg" type="text" className="input" placeholder="0000000" value={form.rg} onChange={set("rg")} />
                </div>
                <div className="input-group" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0" }}>
                  <input id="is_adventista" type="checkbox" checked={form.is_adventista} onChange={set("is_adventista")} style={{ width: "18px", height: "18px", accentColor: "var(--brand-500)" }} />
                  <label className="input-label" htmlFor="is_adventista" style={{ margin: 0, cursor: "pointer" }}>Jogador adventista</label>
                </div>
                <div className="input-group" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0" }}>
                  <input id="is_capitao" type="checkbox" checked={form.is_capitao} onChange={set("is_capitao")} style={{ width: "18px", height: "18px", accentColor: "var(--gold-500)" }} />
                  <label className="input-label" htmlFor="is_capitao" style={{ margin: 0, cursor: "pointer" }}>Capitão do time</label>
                </div>
              </div>
            </div>

            <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h2 className="heading-sm" style={{ marginBottom: "1.25rem" }}>📸 Fotos</h2>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label className="input-label">Foto do Jogador</label>
                  <div className="file-upload" style={{ padding: "1.25rem" }} onClick={() => document.getElementById("foto-input")?.click()}>
                    <input id="foto-input" type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0] || null; setFotoFile(f); if (f) setFotoPreview(URL.createObjectURL(f)); }} />
                    {fotoPreview ? <img src={fotoPreview} alt="Foto" style={{ maxHeight: "80px", borderRadius: "var(--radius-md)", margin: "0 auto" }} /> : <><div className="file-upload-icon" style={{ fontSize: "2rem" }}>📷</div><div className="file-upload-text">Foto do jogador</div></>}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Foto da Identidade</label>
                  <div className="file-upload" style={{ padding: "1.25rem" }} onClick={() => document.getElementById("ident-input")?.click()}>
                    <input id="ident-input" type="file" accept="image/*" style={{ display: "none" }} onChange={e => setIdentFile(e.target.files?.[0] || null)} />
                    <div className="file-upload-icon" style={{ fontSize: "2rem" }}>{identFile ? "✅" : "🪪"}</div>
                    <div className="file-upload-text">{identFile ? identFile.name : "Foto da identidade"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
              <button id="submit-jogador" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar jogador →"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
