import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !["super_admin", "placarista"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const {
    modalidade,
    time_a_id,
    time_b_id,
    gols_time_a,
    gols_time_b,
    sets_vencidos_a,
    sets_vencidos_b,
    finalizado,
    fase,
    grupo_id,
    vencedor_wo_id
  } = await req.json();
  const id = params.id;

  const sb = supabaseAdmin();
  const updateData: any = {};
  if (gols_time_a !== null) updateData.gols_time_a = gols_time_a;
  if (gols_time_b !== null) updateData.gols_time_b = gols_time_b;
  if (sets_vencidos_a !== null) updateData.sets_vencidos_a = sets_vencidos_a;
  if (sets_vencidos_b !== null) updateData.sets_vencidos_b = sets_vencidos_b;
  updateData.finalizado = finalizado;
  if (vencedor_wo_id !== undefined) updateData.vencedor_wo_id = vencedor_wo_id;

  const { error } = await sb.from("games").update(updateData).eq("id", id);
  if (error) {
    console.error("Erro PATCH /api/jogos/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAction((session.user as any).id, "ATUALIZA_PLACAR", { jogo_id: id, finalizado, updateData });

  if (finalizado && fase.includes("Grupo")) {
    await atualizaClassificacao(sb, time_a_id, grupo_id, modalidade);
    await atualizaClassificacao(sb, time_b_id, grupo_id, modalidade);
  } else if (finalizado && !fase.includes("Grupo")) {
    await avancaMataMata(sb, modalidade, fase, id, time_a_id, time_b_id, updateData, vencedor_wo_id);
  }

  return NextResponse.json({ success: true });
}

async function atualizaClassificacao(sb: any, time_id: string, grupo_id: string, modalidade: string) {
  // Simplificacao da logica de grupo (depende dos jogos finalizados do time)
  // Em um sistema real, recalculamos os pontos baseados em vitorias, empates e W.O.
}

async function avancaMataMata(sb: any, modalidade: string, fase: string, jogo_id: string, time_a_id: string, time_b_id: string, placar: any, vencedor_wo_id: string | null) {
  // Definir vencedor
  let vencedor_id = null;
  if (vencedor_wo_id) {
    vencedor_id = vencedor_wo_id;
  } else if (placar.gols_time_a !== undefined) {
    if (placar.gols_time_a > placar.gols_time_b) vencedor_id = time_a_id;
    else if (placar.gols_time_b > placar.gols_time_a) vencedor_id = time_b_id;
  } else if (placar.sets_vencidos_a !== undefined) {
    if (placar.sets_vencidos_a > placar.sets_vencidos_b) vencedor_id = time_a_id;
    else if (placar.sets_vencidos_b > placar.sets_vencidos_a) vencedor_id = time_b_id;
  }

  if (!vencedor_id) return;

  // Encontrar o jogo da proxima fase que dependa desse
  const nextFase = getNextFase(fase);
  if (!nextFase) return;

  const { data: nextJogos } = await sb.from("games")
    .select("id, time_a_id, time_b_id")
    .eq("modalidade", modalidade)
    .eq("fase", nextFase)
    .order("data_hora", { ascending: true });

  if (!nextJogos || nextJogos.length === 0) return;

  // Lógica muito simplificada: procura o primeiro slot vazio
  const slot = nextJogos.find((j: any) => !j.time_a_id || !j.time_b_id);
  if (slot) {
    const field = !slot.time_a_id ? "time_a_id" : "time_b_id";
    await sb.from("games").update({ [field]: vencedor_id }).eq("id", slot.id);
  }
}

function getNextFase(fase: string) {
  if (fase === "Oitavas") return "Quartas";
  if (fase === "Quartas") return "Semi";
  if (fase === "Semi") return "Final";
  return null;
}
