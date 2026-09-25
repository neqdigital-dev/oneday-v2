import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (!["super_admin", "secretaria", "placarista"].includes(role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const sb = supabaseAdmin();
  const { modalidade } = await req.json();

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  // Zerar placares da Fase de Grupos
  await sb.from("games").update({
    gols_time_a: null,
    gols_time_b: null,
    sets_vencidos_a: null,
    sets_vencidos_b: null,
    finalizado: false,
    vencedor_id: null,
    vencedor_wo_id: null
  }).eq("campeonato_id", camp.id).eq("modalidade", modalidade).eq("fase", "Fase de Grupos");

  // Deletar os jogos do Mata-Mata
  await sb.from("games")
    .delete()
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .in("fase", ["Quartas de Final", "Semifinal", "Final", "Disputa 3º Lugar"]);

  // Resetar a classificação
  const { data: grupos } = await sb.from("grupos").select("id").eq("campeonato_id", camp.id).eq("modalidade", modalidade);
  if (grupos && grupos.length > 0) {
    const grupoIds = grupos.map((g) => g.id);
    await sb.from("classificacao").update({
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      gols_pro: 0,
      gols_contra: 0,
      jogos_disputados: 0
    }).in("grupo_id", grupoIds);
  }

  await logAction((session.user as any).id, "ZERAR_PLACARES", { modalidade });
  return NextResponse.json({ success: true });
}
