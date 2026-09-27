import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["super_admin", "placarista", "secretaria"].includes((session.user as any).role)) {
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
    vencedor_wo_id,
    campeonato_id // Assuming the client passes this, if not we must fetch it. We'll fetch it just in case.
  } = await req.json();
  const { id } = await params;

  const sb = supabaseAdmin();
  
  // Obter o campeonato_id do jogo se não veio
  let camp_id = campeonato_id;
  if (!camp_id) {
    const { data: jogoExistente } = await sb.from("games").select("campeonato_id").eq("id", id).single();
    if (jogoExistente) camp_id = jogoExistente.campeonato_id;
  }

  const updateData: any = {};
  if (gols_time_a !== null) updateData.gols_time_a = gols_time_a;
  if (gols_time_b !== null) updateData.gols_time_b = gols_time_b;
  if (sets_vencidos_a !== null) updateData.sets_vencidos_a = sets_vencidos_a;
  if (sets_vencidos_b !== null) updateData.sets_vencidos_b = sets_vencidos_b;
  updateData.finalizado = finalizado;
  
  // Calcula o vencedor automaticamente
  let vencedor_id = null;
  if (vencedor_wo_id) {
    updateData.vencedor_wo_id = vencedor_wo_id;
    vencedor_id = vencedor_wo_id;
  } else if (modalidade?.includes("Futebol")) {
    if (gols_time_a > gols_time_b) vencedor_id = time_a_id;
    else if (gols_time_b > gols_time_a) vencedor_id = time_b_id;
  } else {
    if (sets_vencidos_a > sets_vencidos_b) vencedor_id = time_a_id;
    else if (sets_vencidos_b > sets_vencidos_a) vencedor_id = time_b_id;
  }
  updateData.vencedor_id = vencedor_id;

  const { error } = await sb.from("games").update(updateData).eq("id", id);
  if (error) {
    console.error("Erro PATCH /api/jogos/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAction((session.user as any).id, "ATUALIZA_PLACAR", { jogo_id: id, finalizado, updateData });

  if (finalizado && fase.includes("Grupo")) {
    await atualizaClassificacao(sb, time_a_id, camp_id);
    await atualizaClassificacao(sb, time_b_id, camp_id);

    // Verifica se todos os jogos desta modalidade na Fase de Grupos já terminaram
    const { data: pendentes } = await sb.from("games")
      .select("id")
      .eq("campeonato_id", camp_id)
      .eq("modalidade", modalidade)
      .eq("fase", "Fase de Grupos")
      .eq("finalizado", false);

    if (pendentes && pendentes.length === 0) {
      // TODOS OS JOGOS FINALIZADOS! Gerar mata-mata automaticamente!
      // await gerarMataMataAutomatico(sb, camp_id, modalidade, (session.user as any).id); // AUTOMATIC GENERATION DISABLED
    }
  } else if (finalizado && !fase.includes("Grupo")) {
    await avancaMataMata(sb, modalidade, fase, id, time_a_id, time_b_id, updateData, vencedor_wo_id);
  }

  return NextResponse.json({ success: true });
}

async function atualizaClassificacao(sb: any, time_id: string, campeonato_id: string) {
  if (!time_id || !campeonato_id) return;
  
  // Busca o grupo_id do time na tabela classificacao
  const { data: classifExistente } = await sb.from("classificacao")
    .select("id, grupo_id")
    .eq("time_id", time_id)
    .eq("campeonato_id", campeonato_id)
    .single();

  if (!classifExistente) return;

  // Pega todos os jogos finalizados do time na fase de grupos
  const { data: jogos } = await sb.from("games")
    .select("*")
    .eq("campeonato_id", campeonato_id)
    .eq("fase", "Fase de Grupos")
    .eq("finalizado", true)
    .or(`time_a_id.eq.${time_id},time_b_id.eq.${time_id}`);

  if (!jogos) return;

  let vitorias = 0;
  let empates = 0;
  let derrotas = 0;
  let gols_pro = 0;
  let gols_contra = 0;

  for (const j of jogos) {
    const isA = j.time_a_id === time_id;
    const isWinner = j.vencedor_id === time_id;
    const isDraw = j.vencedor_id === null;

    if (isWinner) vitorias++;
    else if (isDraw) empates++;
    else derrotas++;

    if (j.modalidade.includes("Futebol")) {
      gols_pro += isA ? (j.gols_time_a || 0) : (j.gols_time_b || 0);
      gols_contra += isA ? (j.gols_time_b || 0) : (j.gols_time_a || 0);
    } else {
      gols_pro += isA ? (j.sets_vencidos_a || 0) : (j.sets_vencidos_b || 0);
      gols_contra += isA ? (j.sets_vencidos_b || 0) : (j.sets_vencidos_a || 0);
    }
  }

  if (classifExistente) {
    await sb.from("classificacao").update({
      jogos_disputados: jogos.length,
      vitorias,
      empates,
      derrotas,
      gols_pro,
      gols_contra
    }).eq("id", classifExistente.id);
  }
}

async function avancaMataMata(sb: any, modalidade: string, fase: string, jogo_id: string, time_a_id: string, time_b_id: string, placar: any, vencedor_wo_id: string | null) {
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

  const nextFase = getNextFase(fase);
  if (!nextFase) return;

  const { data: nextJogos } = await sb.from("games")
    .select("id, time_a_id, time_b_id")
    .eq("modalidade", modalidade)
    .eq("fase", nextFase)
    .order("data_hora", { ascending: true });

  if (!nextJogos || nextJogos.length === 0) return;

  const slot = nextJogos.find((j: any) => !j.time_a_id || !j.time_b_id);
  if (slot) {
    const field = !slot.time_a_id ? "time_a_id" : "time_b_id";
    await sb.from("games").update({ [field]: vencedor_id }).eq("id", slot.id);
  }
}

function getNextFase(fase: string) {
  if (fase === "Quartas de Final") return "Semifinal";
  if (fase === "Semifinal") return "Final";
  return null;
}
