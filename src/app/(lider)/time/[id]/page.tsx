import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { formatDate, calcularIdade } from "@/lib/utils";
import DeleteJogadorBtn from "./DeleteJogadorBtn";

async function getTime(id: string, userId: string, role: string) {
  const sb = supabaseAdmin();
  const { data: time, error } = await sb.from("times")
    .select("*, jogadores(*), grupos(nome)")
    .eq("id", parseInt(id))
    .single();

  if (error || !time) return null;
  if (!["super_admin", "admin"].includes(role) && time.lider_id !== userId) return null;
  return time;
}

export default async function VerTimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const time = await getTime(id, userId, role);

  if (!time) return (
    <div className="page-wrapper"><Navbar />
      <main className="page-content"><div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Time não encontrado ou sem permissão.</h2>
        <Link href="/meus-times" className="btn btn-ghost" style={{ marginTop: "1rem" }}>← Voltar</Link>
      </div></main>
    </div>
  );

  const dataCampeonato = new Date("2026-08-02");

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container-md">
          {/* Header do time */}
          <div className="card card-padded-lg animate-fade-in" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              {time.imagem_url ? (
                <img src={time.imagem_url} alt={time.nome_igreja} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--glass-border)" }} />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--glass-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", border: "3px solid var(--glass-border)" }}>⚽</div>
              )}
              <div style={{ flex: 1 }}>
                <h1 className="heading-md">{time.nome_base || time.nome_igreja}</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{time.nome_igreja}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.625rem" }}>
                  <span className={`badge ${time.modalidade === "Futebol Masculino" ? "badge-blue" : time.modalidade === "Futebol Feminino" ? "badge-pink" : "badge-orange"}`}>{time.modalidade}</span>
                  <span className={`badge ${time.pagou ? "badge-green" : "badge-red"}`}>{time.pagou ? "✓ Pago" : "⏳ Pagamento pendente"}</span>
                  {time.cadastros_encerrados && <span className="badge badge-gray">Cadastros encerrados</span>}
                  {time.grupos && <span className="badge badge-blue">{time.grupos.nome}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {!time.cadastros_encerrados && (
                  <Link href={`/time/${id}/cadastro-jogador`} className="btn btn-primary btn-sm">+ Jogador</Link>
                )}
                <Link href={`/time/${id}/editar`} className="btn btn-ghost btn-sm">Editar time</Link>
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="card card-padded" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              {time.distrito && <div><div className="stat-label">Distrito</div><div style={{ fontWeight: "600", marginTop: "0.25rem" }}>{time.distrito}</div></div>}
              {time.regiao && <div><div className="stat-label">Região</div><div style={{ fontWeight: "600", marginTop: "0.25rem", fontSize: "0.875rem" }}>{time.regiao}</div></div>}
              {time.diretor_jovem && <div><div className="stat-label">Diretor Jovem</div><div style={{ fontWeight: "600", marginTop: "0.25rem" }}>{time.diretor_jovem}</div></div>}
              <div><div className="stat-label">Total Jogadores</div><div style={{ fontWeight: "800", fontSize: "1.5rem", marginTop: "0.25rem", color: "var(--brand-400)" }}>{time.jogadores?.length || 0}</div></div>
            </div>
          </div>

          {/* Pagamento */}
          {!time.pagou && time.link_pagamento && (
            <div className="alert alert-warning" style={{ marginBottom: "1.5rem" }}>
              ⚠️ Pagamento pendente.{" "}
              <a href={time.link_pagamento} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Acessar link de pagamento →</a>
            </div>
          )}

          {/* Jogadores */}
          <div className="section-header">
            <h2 className="heading-sm">👥 Jogadores ({time.jogadores?.length || 0})</h2>
            {!time.cadastros_encerrados && (
              <Link href={`/time/${id}/cadastro-jogador`} className="btn btn-primary btn-sm">+ Adicionar jogador</Link>
            )}
          </div>

          {(!time.jogadores || time.jogadores.length === 0) ? (
            <div className="card card-padded" style={{ textAlign: "center", padding: "2rem" }}>
              <p style={{ color: "var(--text-secondary)" }}>Nenhum jogador cadastrado ainda.</p>
              {!time.cadastros_encerrados && <Link href={`/time/${id}/cadastro-jogador`} className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>Adicionar primeiro jogador</Link>}
            </div>
          ) : (
            <div className="table-wrapper" style={{ marginBottom: "2rem" }}>
              <table className="table">
                <thead>
                  <tr><th>Jogador</th><th>Idade</th><th>CPF</th><th>Perfil</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {time.jogadores.map((j: any) => (
                    <tr key={j.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          {j.foto_url ? <img src={j.foto_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--glass-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>👤</div>}
                          <div>
                            <div style={{ fontWeight: "600" }}>{j.nome_completo}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{j.telefone}</div>
                          </div>
                        </div>
                      </td>
                      <td>{j.data_nascimento ? calcularIdade(j.data_nascimento, dataCampeonato) + " anos" : "—"}</td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{j.cpf || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          {j.is_capitao && <span className="badge badge-gold">Capitão</span>}
                          {!j.is_adventista && <span className="badge badge-red">Não Adv.</span>}
                          {j.is_adventista && <span className="badge badge-green">Adventista</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {!time.cadastros_encerrados && <Link href={`/jogador/${j.id}/editar`} className="btn btn-ghost btn-sm">Editar</Link>}
                          {!time.cadastros_encerrados && <DeleteJogadorBtn jogadorId={j.id} timeId={parseInt(id)} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
