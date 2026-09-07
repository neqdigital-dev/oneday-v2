import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (!["super_admin", "admin", "placarista"].includes(role))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const sb = supabaseAdmin();
  const body = await req.json();

  // Determinar vencedor automático
  let vencedor_id = null;
  if (body.finalizado) {
    if (body.modalidade?.includes("Futebol")) {
      if (body.gols_time_a > body.gols_time_b) vencedor_id = body.time_a_id;
      else if (body.gols_time_b > body.gols_time_a) vencedor_id = body.time_b_id;
    } else {
      if (body.sets_vencidos_a > body.sets_vencidos_b) vencedor_id = body.time_a_id;
      else if (body.sets_vencidos_b > body.sets_vencidos_a) vencedor_id = body.time_b_id;
    }
  }

  const { data, error } = await sb.from("games").update({ ...body, vencedor_id }).eq("id", parseInt(id)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Atualizar classificação se fase de grupos e finalizado
  if (body.finalizado && body.fase === "Fase de Grupos") {
    await atualizarClassificacao(sb, data);
  }

  return NextResponse.json(data);
}

async function atualizarClassificacao(sb: any, jogo: any) {
  const updateTime = async (timeId: number, isWinner: boolean, isDraw: boolean, gosPro: number, gosCon: number, grupoId: number, campId: number) => {
    const { data: cl } = await sb.from("classificacao").select("*").eq("time_id", timeId).eq("grupo_id", grupoId).single();
    if (!cl) return;
    await sb.from("classificacao").update({
      jogos_disputados: cl.jogos_disputados + 1,
      vitorias: cl.vitorias + (isWinner ? 1 : 0),
      empates: cl.empates + (isDraw ? 1 : 0),
      derrotas: cl.derrotas + (!isWinner && !isDraw ? 1 : 0),
      gols_pro: cl.gols_pro + gosPro,
      gols_contra: cl.gols_contra + gosCon,
    }).eq("id", cl.id);
  };

  if (!jogo.time_a_id || !jogo.time_b_id || !jogo.grupo_id) return;
  const isDraw = jogo.gols_time_a === jogo.gols_time_b && jogo.vencedor_id === null;
  const aWins = jogo.vencedor_id === jogo.time_a_id;
  await updateTime(jogo.time_a_id, aWins, isDraw, jogo.gols_time_a || 0, jogo.gols_time_b || 0, jogo.grupo_id, jogo.campeonato_id);
  await updateTime(jogo.time_b_id, !aWins && !isDraw, isDraw, jogo.gols_time_b || 0, jogo.gols_time_a || 0, jogo.grupo_id, jogo.campeonato_id);
}
