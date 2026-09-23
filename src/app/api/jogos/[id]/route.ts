import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      await gerarMataMataAutomatico(sb, camp_id, modalidade, (session.user as any).id);
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

async function gerarMataMataAutomatico(sb: any, campeonato_id: string, modalidade: string, user_id: string) {
  // Verifica se já existe mata-mata
  const { data: jogosExistentes } = await sb.from("games")
    .select("id")
    .eq("campeonato_id", campeonato_id)
    .eq("modalidade", modalidade)
    .in("fase", ["Quartas de Final", "Semifinal", "Final"]);
    
  if (jogosExistentes && jogosExistentes.length > 0) return; // Já gerou

  // Pega os grupos da modalidade
  const { data: grupos } = await sb.from("grupos")
    .select("id, nome")
    .eq("campeonato_id", campeonato_id)
    .eq("modalidade", modalidade)
    .order("nome");
    
  if (!grupos || grupos.length === 0) return;

  // Pega a classificação
  const { data: classifRaw } = await sb.from("classificacao")
    .select("*, time:times(id, nome_igreja)")
    .eq("campeonato_id", campeonato_id);

  let classificados: any[] = [];
  let terceirosLugares: any[] = [];

  for (const grupo of grupos) {
    const classifGrupo = classifRaw?.filter((c: any) => c.grupo_id === grupo.id) || [];
    const rankingGrupo = classifGrupo.sort((a: any, b: any) => {
      const ptsA = (a.vitorias * 3) + a.empates;
      const ptsB = (b.vitorias * 3) + b.empates;
      if (ptsB !== ptsA) return ptsB - ptsA;
      const sgA = a.gols_pro - a.gols_contra;
      const sgB = b.gols_pro - b.gols_contra;
      if (sgB !== sgA) return sgB - sgA;
      return b.gols_pro - a.gols_pro;
    });

    if (rankingGrupo.length > 0) classificados.push(rankingGrupo[0]);
    if (rankingGrupo.length > 1) classificados.push(rankingGrupo[1]);
    if (rankingGrupo.length > 2) terceirosLugares.push(rankingGrupo[2]);
  }

  if (grupos.length === 3 && classificados.length === 6 && terceirosLugares.length > 0) {
    const rankingTerceiros = terceirosLugares.sort((a: any, b: any) => {
      const ptsA = (a.vitorias * 3) + a.empates;
      const ptsB = (b.vitorias * 3) + b.empates;
      if (ptsB !== ptsA) return ptsB - ptsA;
      const sgA = a.gols_pro - a.gols_contra;
      const sgB = b.gols_pro - b.gols_contra;
      if (sgB !== sgA) return sgB - sgA;
      return b.gols_pro - a.gols_pro;
    });
    classificados.push(rankingTerceiros[0]);
    classificados.push(rankingTerceiros[1]);
  }

  const rankingGeral = classificados.sort((a: any, b: any) => {
    const ptsA = (a.vitorias * 3) + a.empates;
    const ptsB = (b.vitorias * 3) + b.empates;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const sgA = a.gols_pro - a.gols_contra;
    const sgB = b.gols_pro - b.gols_contra;
    if (sgB !== sgA) return sgB - sgA;
    return b.gols_pro - a.gols_pro;
  });

  let totalCriados = 0;
  
  if (rankingGeral.length === 8) {
    const { data: final } = await sb.from("games").insert({ campeonato_id, modalidade, fase: "Final", ordem_na_fase: 1 }).select().single();
    
    const { data: semi1 } = await sb.from("games").insert({ campeonato_id, modalidade, fase: "Semifinal", ordem_na_fase: 1, proximo_jogo_id: final?.id }).select().single();
    const { data: semi2 } = await sb.from("games").insert({ campeonato_id, modalidade, fase: "Semifinal", ordem_na_fase: 2, proximo_jogo_id: final?.id }).select().single();

    const qMatches = [
      { tA: rankingGeral[0].time_id, tB: rankingGeral[7].time_id, next: semi1?.id },
      { tA: rankingGeral[3].time_id, tB: rankingGeral[4].time_id, next: semi1?.id },
      { tA: rankingGeral[2].time_id, tB: rankingGeral[5].time_id, next: semi2?.id },
      { tA: rankingGeral[1].time_id, tB: rankingGeral[6].time_id, next: semi2?.id },
    ];

    for (let i = 0; i < 4; i++) {
      await sb.from("games").insert({
        campeonato_id,
        modalidade,
        fase: "Quartas de Final",
        time_a_id: qMatches[i].tA,
        time_b_id: qMatches[i].tB,
        ordem_na_fase: i + 1,
        proximo_jogo_id: qMatches[i].next
      });
    }
    totalCriados = 8;
  } else if (rankingGeral.length === 4) {
    const { data: final } = await sb.from("games").insert({ campeonato_id, modalidade, fase: "Final", ordem_na_fase: 1 }).select().single();

    const sMatches = [
      { tA: rankingGeral[0].time_id, tB: rankingGeral[3].time_id, next: final?.id },
      { tA: rankingGeral[1].time_id, tB: rankingGeral[2].time_id, next: final?.id },
    ];

    for (let i = 0; i < 2; i++) {
      await sb.from("games").insert({
        campeonato_id,
        modalidade,
        fase: "Semifinal",
        time_a_id: sMatches[i].tA,
        time_b_id: sMatches[i].tB,
        ordem_na_fase: i + 1,
        proximo_jogo_id: sMatches[i].next
      });
    }
    totalCriados = 4;
  } else if (rankingGeral.length === 2) {
    await sb.from("games").insert({
      campeonato_id,
      modalidade,
      fase: "Final",
      time_a_id: rankingGeral[0].time_id,
      time_b_id: rankingGeral[1].time_id,
      ordem_na_fase: 1
    });
    totalCriados = 1;
  }

  if (totalCriados > 0) {
    await logAction(user_id, "GERAR_MATA_MATA_AUTOMATICO", { modalidade, classificados: rankingGeral.length, jogosCriados: totalCriados });
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
