import { supabaseAdmin } from "@/lib/supabase";
import CheckinClient from "./CheckinClient";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return <div style={{ padding: "40px", textAlign: "center" }}>Nenhum campeonato ativo.</div>;

  const { data: times } = await sb.from("times")
    .select("*, jogadores(*)")
    .eq("campeonato_id", camp.id)
    .order("nome_base");

  return <CheckinClient times={times || []} />;
}
