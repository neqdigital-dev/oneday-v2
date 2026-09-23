import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const sb = supabaseAdmin();
  
  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  // Pega todas as classificacoes
  const { data: classificacoes } = await sb.from("classificacao").select("id, time_id, grupo_id, campeonato_id").eq("campeonato_id", camp.id);
  if (!classificacoes || classificacoes.length === 0) {
    return NextResponse.json({ error: "Nenhuma classificação encontrada." }, { status: 400 });
  }

  let atualizados = 0;

  for (const cls of classificacoes) {
    // Pega todos os jogos finalizados desse time na fase de grupos
    const { data: jogos } = await sb.from("games")
      .select("*")
      .eq("campeonato_id", camp.id)
      .eq("fase", "Fase de Grupos")
      .eq("finalizado", true)
      .or(`time_a_id.eq.${cls.time_id},time_b_id.eq.${cls.time_id}`);

    if (!jogos) continue;

    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    let gols_pro = 0;
    let gols_contra = 0;

    for (const j of jogos) {
      const isA = j.time_a_id === cls.time_id;
      const isWinner = j.vencedor_id === cls.time_id;
      const isDraw = j.vencedor_id === null;

      if (isWinner) vitorias++;
      else if (isDraw) empates++;
      else derrotas++;

      if (j.modalidade?.toLowerCase().includes("futebol")) {
        gols_pro += isA ? (j.gols_time_a || 0) : (j.gols_time_b || 0);
        gols_contra += isA ? (j.gols_time_b || 0) : (j.gols_time_a || 0);
      } else {
        gols_pro += isA ? (j.sets_vencidos_a || 0) : (j.sets_vencidos_b || 0);
        gols_contra += isA ? (j.sets_vencidos_b || 0) : (j.sets_vencidos_a || 0);
      }
    }

    await sb.from("classificacao").update({
      jogos_disputados: jogos.length,
      vitorias,
      empates,
      derrotas,
      gols_pro,
      gols_contra
    }).eq("id", cls.id);

    atualizados++;
  }

  return NextResponse.json({ success: true, atualizados });
}
