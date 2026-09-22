import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import AdminActions from "./AdminActions";
import TabsFilter from './TabsFilter';


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
  if (role !== "super_admin") redirect("/acesso-negado");

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
              <h1 className="heading-lg">Times Cadastrados</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{data.camp.nome}</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/super-admin/dashboard" className="btn btn-ghost btn-sm">⬅️ Voltar ao Dashboard</Link>
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
                <div className="stat-label">{mod === "Futebol Masculino" ? "Fut. Masc." : mod === "Futebol Feminino" ? "Fut. Fem." : mod === "Vôlei Masculino" ? "Vôlei Masc." : mod === "Vôlei Feminino" ? "Vôlei Fem." : mod === "Tênis de Mesa" ? "Tênis" : mod}</div>
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
          <TabsFilter times={data.times} />
        </div>
      </main>
    </div>
  );
}

