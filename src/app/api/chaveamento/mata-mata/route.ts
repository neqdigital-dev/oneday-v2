import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (!["super_admin", "placarista", "secretaria"].includes(role)) return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });

  const sb = supabaseAdmin();
  const { modalidade } = await req.json();

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  // Verifica se já existe mata-mata
  const { data: jogosExistentes } = await sb.from("games")
    .select("id")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .in("fase", ["Quartas de Final", "Semifinal", "Final"]);
    
  if (jogosExistentes && jogosExistentes.length > 0) {
    return NextResponse.json({ error: "Mata-mata já gerado para esta modalidade." }, { status: 400 });
  }

  // Pega os grupos da modalidade
  const { data: grupos } = await sb.from("grupos")
    .select("id, nome")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .order("nome");
    
  if (!grupos || grupos.length === 0) {
    return NextResponse.json({ error: "Nenhum grupo encontrado." }, { status: 400 });
  }

  // Pega a classificação
  const { data: classifRaw } = await sb.from("classificacao")
    .select("*, time:times(id, nome_igreja)")
    .eq("campeonato_id", camp.id);

  let classificados: any[] = [];
  let terceirosLugares: any[] = [];

  for (const grupo of grupos) {
    const classifGrupo = classifRaw?.filter(c => c.grupo_id === grupo.id) || [];
    const rankingGrupo = classifGrupo.sort((a, b) => {
      const ptsA = modalidade.includes("Futebol") ? (a.vitorias * 3) + a.empates : a.vitorias;
      const ptsB = modalidade.includes("Futebol") ? (b.vitorias * 3) + b.empates : b.vitorias;
      if (ptsB !== ptsA) return ptsB - ptsA;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      const sgA = a.gols_pro - a.gols_contra;
      const sgB = b.gols_pro - b.gols_contra;
      if (sgB !== sgA) return sgB - sgA;
      return b.gols_pro - a.gols_pro;
    });

    if (rankingGrupo.length > 0) classificados.push(rankingGrupo[0]);
    if (rankingGrupo.length > 1) classificados.push(rankingGrupo[1]);
    if (rankingGrupo.length > 2) terceirosLugares.push(rankingGrupo[2]);
  }

  // Lógica para 3 grupos (classifica os 2 melhores terceiros)
  if (grupos.length === 3 && classificados.length === 6 && terceirosLugares.length > 0) {
    const rankingTerceiros = terceirosLugares.sort((a, b) => {
      // Simplificado: ignorando a normalização complexa por enquanto
      // Idealmente, se um grupo tiver 5 times, precisaríamos descontar os pontos contra o último.
      // O V1 fazia isso, mas para manter robusto aqui vamos ordenar direto.
      const ptsA = modalidade.includes("Futebol") ? (a.vitorias * 3) + a.empates : a.vitorias;
      const ptsB = modalidade.includes("Futebol") ? (b.vitorias * 3) + b.empates : b.vitorias;
      if (ptsB !== ptsA) return ptsB - ptsA;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      const sgA = a.gols_pro - a.gols_contra;
      const sgB = b.gols_pro - b.gols_contra;
      if (sgB !== sgA) return sgB - sgA;
      return b.gols_pro - a.gols_pro;
    });
    classificados.push(rankingTerceiros[0]);
    classificados.push(rankingTerceiros[1]);
  }

  // Ranking geral dos classificados
  const rankingGeral = classificados.sort((a, b) => {
    const ptsA = modalidade.includes("Futebol") ? (a.vitorias * 3) + a.empates : a.vitorias;
    const ptsB = modalidade.includes("Futebol") ? (b.vitorias * 3) + b.empates : b.vitorias;
    if (ptsB !== ptsA) return ptsB - ptsA;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    const sgA = a.gols_pro - a.gols_contra;
    const sgB = b.gols_pro - b.gols_contra;
    if (sgB !== sgA) return sgB - sgA;
    return b.gols_pro - a.gols_pro;
  });

  let totalCriados = 0;
  let localName = "";
  if (modalidade.includes("Futebol")) localName = "Quadra 1";
  if (modalidade.includes("Vôlei")) localName = "Quadra 1";
  if (modalidade.includes("Tênis de Mesa")) localName = "Mesa 1";
  let matches: any[] = [];
  
  if (rankingGeral.length === 8) {
    // QUARTAS DE FINAL -> SEMIFINAL -> FINAL
    // placeholder games first to get IDs
    const { data: final } = await sb.from("games").insert({ campeonato_id: camp.id, modalidade, fase: "Final", ordem_na_fase: 1, local: localName }).select().single();
    
    const { data: semi1 } = await sb.from("games").insert({ campeonato_id: camp.id, modalidade, fase: "Semifinal", ordem_na_fase: 1, proximo_jogo_id: final?.id, local: localName }).select().single();
    const { data: semi2 } = await sb.from("games").insert({ campeonato_id: camp.id, modalidade, fase: "Semifinal", ordem_na_fase: 2, proximo_jogo_id: final?.id, local: localName }).select().single();

    let qMatches = [];
    if (grupos.length === 4 && classificados.length === 8) {
      // 4 Grupos: Cruzamento clássico (1ºA x 2ºB, 1ºB x 2ºA, 1ºC x 2ºD, 1ºD x 2ºC)
      // classificados = [1A, 2A, 1B, 2B, 1C, 2C, 1D, 2D]
      qMatches = [
        { tA: classificados[0].time_id, tB: classificados[3].time_id, next: semi1?.id },
        { tA: classificados[2].time_id, tB: classificados[1].time_id, next: semi2?.id },
        { tA: classificados[4].time_id, tB: classificados[7].time_id, next: semi1?.id },
        { tA: classificados[6].time_id, tB: classificados[5].time_id, next: semi2?.id },
      ];
    } else if (grupos.length === 3 && classificados.length === 8) {
      // 3 Grupos: 1ºA, 2ºA, 1ºB, 2ºB, 1ºC, 2ºC + 2 melhores 3ºs
      // Vamos usar uma tabela de cruzamento padrão que evita confrontos do mesmo grupo na QF o máximo possível
      const firstA = classificados[0];
      const secondA = classificados[1];
      const firstB = classificados[2];
      const secondB = classificados[3];
      const firstC = classificados[4];
      const secondC = classificados[5];
      let third1 = classificados[6];
      let third2 = classificados[7];

      // Tenta não colocar o 3º contra o 1º do próprio grupo
      if (third1.grupo_id === firstA.grupo_id || third2.grupo_id === firstB.grupo_id) {
         // inverte os terceiros
         const temp = third1;
         third1 = third2;
         third2 = temp;
      }

      qMatches = [
        { tA: firstA.time_id, tB: third1.time_id, next: semi1?.id },
        { tA: firstB.time_id, tB: third2.time_id, next: semi2?.id },
        { tA: firstC.time_id, tB: secondA.time_id, next: semi1?.id },
        { tA: secondB.time_id, tB: secondC.time_id, next: semi2?.id },
      ];
    } else {
      qMatches = [
        { tA: rankingGeral[0].time_id, tB: rankingGeral[7].time_id, next: semi1?.id },
        { tA: rankingGeral[3].time_id, tB: rankingGeral[4].time_id, next: semi1?.id },
        { tA: rankingGeral[2].time_id, tB: rankingGeral[5].time_id, next: semi2?.id },
        { tA: rankingGeral[1].time_id, tB: rankingGeral[6].time_id, next: semi2?.id },
      ];
    }

    for (let i = 0; i < 4; i++) {
      await sb.from("games").insert({
        campeonato_id: camp.id,
        modalidade,
        fase: "Quartas de Final",
        time_a_id: qMatches[i].tA,
        time_b_id: qMatches[i].tB,
        ordem_na_fase: i + 1,
        proximo_jogo_id: qMatches[i].next,
        local: localName
      });
    }
    totalCriados = 8;
  } else if (rankingGeral.length === 4) {
    // SEMIFINAL -> FINAL
    const { data: final } = await sb.from("games").insert({ campeonato_id: camp.id, modalidade, fase: "Final", ordem_na_fase: 1, local: localName }).select().single();

    const sMatches = [
      { tA: rankingGeral[0].time_id, tB: rankingGeral[3].time_id, next: final?.id },
      { tA: rankingGeral[1].time_id, tB: rankingGeral[2].time_id, next: final?.id },
    ];

    for (let i = 0; i < 2; i++) {
      await sb.from("games").insert({
        campeonato_id: camp.id,
        modalidade,
        fase: "Semifinal",
        time_a_id: sMatches[i].tA,
        time_b_id: sMatches[i].tB,
        ordem_na_fase: i + 1,
        proximo_jogo_id: sMatches[i].next,
        local: localName
      });
    }
    totalCriados = 4;
  } else if (rankingGeral.length === 2) {
    // APENAS FINAL
    await sb.from("games").insert({
      campeonato_id: camp.id,
      modalidade,
      fase: "Final",
      time_a_id: rankingGeral[0].time_id,
      time_b_id: rankingGeral[1].time_id,
      ordem_na_fase: 1
    });
    totalCriados = 1;
  } else {
    return NextResponse.json({ error: `Número inválido de classificados (${rankingGeral.length}). O sistema suporta chaves de 8, 4 ou 2 times.` }, { status: 400 });
  }

  await logAction((session.user as any).id, "GERAR_MATA_MATA", { modalidade, classificados: rankingGeral.length, jogosCriados: totalCriados });
  return NextResponse.json({ success: true });
}
