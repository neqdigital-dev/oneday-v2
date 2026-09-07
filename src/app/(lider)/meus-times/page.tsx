import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

async function getMyTimes(userId: string) {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id, nome").eq("status", "ativo").single();
  if (!camp) return { times: [], camp: null };

  const { data: times } = await sb.from("times")
    .select("*, jogadores(id)")
    .eq("campeonato_id", camp.id)
    .eq("lider_id", userId)
    .order("nome_igreja");

  return { times: times || [], camp };
}

export default async function MeusTimesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;
  const { times, camp } = await getMyTimes(userId);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container">
          <div className="section-header">
            <div>
              <h1 className="heading-lg">Meus Times</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{camp?.nome || "Campeonato ativo"}</p>
            </div>
            <Link href="/cadastro-time" id="btn-novo-time" className="btn btn-primary">
              + Cadastrar time
            </Link>
          </div>

          {times.length === 0 ? (
            <div className="card card-padded-lg" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏟️</div>
              <h3 className="heading-sm" style={{ marginBottom: "0.5rem" }}>Nenhum time cadastrado</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Cadastre seu time para participar do campeonato.</p>
              <Link href="/cadastro-time" className="btn btn-primary">Cadastrar primeiro time</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
              {times.map((time: any) => (
                <div key={time.id} className="card card-padded card-glow animate-fade-in">
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    {time.imagem_url ? (
                      <img src={time.imagem_url} alt={time.nome_igreja} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--glass-border)" }} />
                    ) : (
                      <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--glass-bg)", border: "2px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>⚽</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "700", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{time.nome_base || time.nome_igreja}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{time.nome_igreja}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1rem" }}>
                    <span className={`badge ${time.modalidade === "Futebol Masculino" ? "badge-blue" : time.modalidade === "Futebol Feminino" ? "badge-pink" : "badge-orange"}`}>
                      {time.modalidade}
                    </span>
                    <span className={`badge ${time.pagou ? "badge-green" : "badge-red"}`}>
                      {time.pagou ? "✓ Pago" : "⏳ Pendente"}
                    </span>
                    {time.cadastros_encerrados && <span className="badge badge-gray">Encerrado</span>}
                  </div>

                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    <span>👥 {time.jogadores?.length || 0} jogadores</span>
                    {time.distrito && <span style={{ marginLeft: "1rem" }}>📍 {time.distrito}</span>}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link href={`/time/${time.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                      Ver time
                    </Link>
                    {!time.cadastros_encerrados && (
                      <Link href={`/time/${time.id}/cadastro-jogador`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                        + Jogador
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
