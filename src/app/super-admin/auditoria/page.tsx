import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function AuditoriaPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    redirect("/acesso-negado");
  }

  const sb = supabaseAdmin();
  const { data: logs, error } = await sb
    .from("logs_auditoria")
    .select("id, acao, detalhes, criado_em, users ( username )")
    .order("criado_em", { ascending: false })
    .limit(100);

  return (
    <div>
      <h2 className="heading-lg" style={{ marginBottom: "1rem" }}>Log de Auditoria</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Aqui você pode ver o histórico das últimas 100 ações críticas realizadas no sistema.
      </p>

      {error ? (
        <div className="card card-padded" style={{ color: "red" }}>Erro ao carregar logs: {error.message}</div>
      ) : logs && logs.length > 0 ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(log.criado_em).toLocaleString("pt-BR")}</td>
                  <td><strong>{log.users?.username || "Sistema"}</strong></td>
                  <td><span className="badge badge-blue">{log.acao}</span></td>
                  <td><pre style={{ fontSize: "0.75rem", margin: 0 }}>{JSON.stringify(log.detalhes, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card card-padded">Nenhum log encontrado.</div>
      )}
    </div>
  );
}

