import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import AdminActions from "./AdminActions";

async function getData() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return null;

  const [{ data: times }, { data: jogadores }, { data: config }] = await Promise.all([
    sb.from("times").select("*, jogadores(id)").eq("campeonato_id", camp.id).order("modalidade").order("nome_igreja"),
    sb.from("jogadores").select("id").eq("campeonato_id", camp.id),
    sb.from("configuracao").select("*").eq("campeonato_id", camp.id).single(),
  ]);

  return { camp, times: times || [], jogadores: jogadores || [], config };
}

export default async function PainelAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (!["super_admin", "admin"].includes(role)) redirect("/acesso-negado");

  const data = await getData();

  if (!data) return (
    <div className="page-wrapper"><Navbar />
      <main className="page-content"><div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Nenhum campeonato ativo.</h2>
        {role === "super_admin" && <Link href="/super-admin/dashboard" className="btn btn-primary" style={{ marginTop: "1rem" }}>Criar campeonato</Link>}
      </div></main>
    </div>
  );

  const pagos = data.times.filter((t: any) => t.pagou).length;
  const naoPageos = data.times.length - pagos;

  const porModalidade = data.times.reduce((acc: any, t: any) => {
    acc[t.modalidade] = (acc[t.modalidade] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="container">
          <div className="section-header" style={{ marginBottom: "2rem" }}>
            <div>
              <h1 className="heading-lg">Painel Admin</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{data.camp.nome}</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {role === "super_admin" && <Link href="/super-admin/dashboard" className="btn btn-ghost btn-sm">⚙️ Super Admin</Link>}
              <a href="/api/admin/relatorio" className="btn btn-ghost btn-sm" download>📊 Excel</a>
              <Link href="/placar" className="btn btn-primary btn-sm">🎯 Placar</Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div className="stat-card">
              <div className="stat-label">Times</div>
              <div className="stat-value text-gradient">{data.times.length}</div>
              <div className="stat-sub">{pagos} pagos · {naoPageos} pendentes</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Jogadores</div>
              <div className="stat-value" style={{ color: "var(--gold-400)" }}>{data.jogadores.length}</div>
            </div>
            {Object.entries(porModalidade).map(([mod, count]: any) => (
              <div key={mod} className="stat-card">
                <div className="stat-label">{mod === "Futebol Masculino" ? "Fut. Masc." : mod === "Futebol Feminino" ? "Fut. Fem." : "Vôlei"}</div>
                <div className="stat-value">{count}</div>
                <div className="stat-sub">times</div>
              </div>
            ))}
          </div>

          <AdminActions campeonatoId={data.camp.id} />

          {/* Times list */}
          <div className="section-header" style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            <h2 className="heading-sm">Times Cadastrados</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Time</th><th>Modalidade</th><th>Jogadores</th><th>Pagamento</th><th>Cadastros</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {data.times.map((time: any) => (
                  <tr key={time.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {time.imagem_url && <img src={time.imagem_url} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />}
                        <div>
                          <div style={{ fontWeight: "600" }}>{time.nome_base || time.nome_igreja}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{time.nome_igreja}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${time.modalidade === "Futebol Masculino" ? "badge-blue" : time.modalidade === "Futebol Feminino" ? "badge-pink" : "badge-orange"}`} style={{ fontSize: "0.7rem" }}>{time.modalidade}</span>
                    </td>
                    <td>{time.jogadores?.length || 0}</td>
                    <td>
                      <span className={`badge ${time.pagou ? "badge-green" : "badge-red"}`} style={{ fontSize: "0.7rem" }}>
                        {time.pagou ? "✓ Pago" : "⏳ Pendente"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${time.cadastros_encerrados ? "badge-gray" : "badge-green"}`} style={{ fontSize: "0.7rem" }}>
                        {time.cadastros_encerrados ? "Encerrado" : "Aberto"}
                      </span>
                    </td>
                    <td>
                      <Link href={`/time/${time.id}`} className="btn btn-ghost btn-sm">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
