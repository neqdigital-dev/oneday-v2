import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCombinations<T>(arr: T[]): [T, T][] {
  const result: [T, T][] = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      result.push([arr[i], arr[j]]);
  return result;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "super_admin") return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });

  const sb = supabaseAdmin();
  const reqBody = await req.json();
  const { modalidade, hora_inicio = "08:30", cabecas_de_chave = [] } = reqBody;

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });
  const campId = camp.id;

  // Limpar dados antigos desta modalidade
  await sb.from("games").delete().eq("campeonato_id", campId).eq("modalidade", modalidade);
  const { data: gruposAntigos } = await sb.from("grupos").select("id").eq("campeonato_id", campId).eq("modalidade", modalidade);
  if (gruposAntigos) {
    for (const g of gruposAntigos) {
      await sb.from("classificacao").delete().eq("grupo_id", g.id);
    }
    await sb.from("grupos").delete().eq("campeonato_id", campId).eq("modalidade", modalidade);
  }
  
  const { data: timesModal } = await sb.from("times").select("id").eq("campeonato_id", campId).eq("modalidade", modalidade).eq("pagou", true);
  if (!timesModal || timesModal.length < 3)
    return NextResponse.json({ error: "São necessários pelo menos 3 times pagantes." }, { status: 400 });

  const times = shuffle(timesModal);
  const numTimes = times.length;

  let numGrupos: number;
  if (numTimes >= 15) numGrupos = 4;
  else if (numTimes >= 12) numGrupos = 3;
  else numGrupos = Math.ceil(numTimes / 4);

  const grupos: any[] = [];
  for (let i = 0; i < numGrupos; i++) {
    const { data: g } = await sb.from("grupos").insert({
      campeonato_id: campId,
      nome: "Grupo " + String.fromCharCode(65 + i),
      modalidade,
    }).select().single();
    if (g) grupos.push(g);
  }

  // Pre-allocate cabecas de chave
  const timesCabecas: any[] = [];
  const timesRestantes: any[] = [];

  for (const t of timesModal) {
    const cc = cabecas_de_chave.find((c: any) => c.time_id === t.id);
    if (cc) timesCabecas.push({ ...t, grupoNomeDesejado: cc.grupo });
    else timesRestantes.push(t);
  }

  const teamsPorGrupo = grupos.map(g => ({ grupo: g, count: 0 }));

  for (const tc of timesCabecas) {
    let grupoDestino = grupos.find(g => g.nome === tc.grupoNomeDesejado);
    // If the chosen group doesn't exist (e.g. selected Group D but only 3 groups), fallback
    if (!grupoDestino) {
      teamsPorGrupo.sort((a, b) => a.count - b.count);
      grupoDestino = teamsPorGrupo[0].grupo;
    }

    await sb.from("times").update({ grupo_id: grupoDestino.id }).eq("id", tc.id);
    await sb.from("classificacao").insert({ campeonato_id: campId, time_id: tc.id, grupo_id: grupoDestino.id });
    
    const countObj = teamsPorGrupo.find(g => g.grupo.id === grupoDestino.id);
    if (countObj) countObj.count++;
  }

  // Insert remaining teams balancedly
  const timesShuffled = shuffle(timesRestantes);
  for (const tr of timesShuffled) {
    teamsPorGrupo.sort((a, b) => a.count - b.count);
    const grupoDestino = teamsPorGrupo[0].grupo;

    await sb.from("times").update({ grupo_id: grupoDestino.id }).eq("id", tr.id);
    await sb.from("classificacao").insert({ campeonato_id: campId, time_id: tr.id, grupo_id: grupoDestino.id });
    
    teamsPorGrupo[0].count++;
  }

  // NOVO ALGORITMO DE AGENDAMENTO (DESCANSO) - Sequência Única (Rodízio de Grupos)
  let todosConfrontos: any[] = [];
  for (const grupo of grupos) {
    const { data: timesDoGrupo } = await sb.from("times").select("id").eq("grupo_id", grupo.id);
    if (!timesDoGrupo) continue;
    const confrontos = getCombinations(timesDoGrupo);
    for (const [ta, tb] of confrontos) {
      todosConfrontos.push({ grupo_id: grupo.id, ta: ta.id, tb: tb.id });
    }
  }

  const scheduledMatches: any[] = [];
  const ultimoJogo: Record<string, number> = {}; // { time_id: ultima_posicao }
  
  // Organiza confrontos por grupo para fazer o rodízio (A -> B -> C -> D)
  const confrontosPorGrupo = new Map<number, any[]>();
  for (const g of grupos) {
    confrontosPorGrupo.set(g.id, todosConfrontos.filter(c => c.grupo_id === g.id));
  }

  let grupoIndex = 0;
  while (true) {
    let matchesAgendadosNesteCiclo = 0;
    
    // Tenta pegar 1 jogo de cada grupo, em ordem
    for (let i = 0; i < grupos.length; i++) {
      const g = grupos[(grupoIndex + i) % grupos.length];
      const matchesDoGrupo = confrontosPorGrupo.get(g.id) || [];
      
      if (matchesDoGrupo.length === 0) continue;
      
      // Escolhe o jogo deste grupo que maximiza o descanso
      let melhorJogo = null;
      let melhorDistancia = -1;
      let melhorIdx = -1;
      const currentPos = scheduledMatches.length;
      
      for (let j = 0; j < matchesDoGrupo.length; j++) {
        const match = matchesDoGrupo[j];
        const distTa = currentPos - (ultimoJogo[match.ta] !== undefined ? ultimoJogo[match.ta] : -999);
        const distTb = currentPos - (ultimoJogo[match.tb] !== undefined ? ultimoJogo[match.tb] : -999);
        const minDist = Math.min(distTa, distTb);
        
        if (minDist > melhorDistancia) {
          melhorDistancia = minDist;
          melhorJogo = match;
          melhorIdx = j;
        }
      }
      
      scheduledMatches.push(melhorJogo);
      ultimoJogo[melhorJogo.ta] = currentPos;
      ultimoJogo[melhorJogo.tb] = currentPos;
      matchesDoGrupo.splice(melhorIdx, 1);
      matchesAgendadosNesteCiclo++;
    }
    
    if (matchesAgendadosNesteCiclo === 0) break; // Acabaram todos os jogos
  }

  // Inserir no Banco de Dados
  const num_quadras = reqBody.num_quadras ? parseInt(reqBody.num_quadras) : 1;
  const [hora, min] = hora_inicio.split(":").map(Number);
  const baseDate = new Date();
  baseDate.setUTCHours(hora + 3, min, 0, 0);

  const temposQuadras = Array(num_quadras).fill(baseDate.getTime());
  const teamFreeTime: Record<string, number> = {};
  const REST_MINUTES = 15; // 15 minutos de descanso obrigatório
  const MATCH_DURATION = modalidade.toLowerCase().includes("futebol") ? 30 : 45;

  let totalSalvos = 0;

  for (let i = 0; i < scheduledMatches.length; i++) {
    const m = scheduledMatches[i];

    const taFree = teamFreeTime[m.ta] || baseDate.getTime();
    const tbFree = teamFreeTime[m.tb] || baseDate.getTime();
    const teamsReadyAt = Math.max(taFree, tbFree);

    let bestQuadraIdx = 0;
    let earliestStartTime = Infinity;

    for (let q = 0; q < num_quadras; q++) {
      const actualStart = Math.max(temposQuadras[q], teamsReadyAt);
      if (actualStart < earliestStartTime) {
        earliestStartTime = actualStart;
        bestQuadraIdx = q;
      }
    }

    const dataHora = new Date(earliestStartTime);
    const endTime = earliestStartTime + MATCH_DURATION * 60000;

    await sb.from("games").insert({
      campeonato_id: campId,
      modalidade,
      fase: "Fase de Grupos",
      time_a_id: m.ta,
      time_b_id: m.tb,
      local: num_quadras === 1 ? "Sequência Única" : "Quadra " + (bestQuadraIdx + 1),
      data_hora: dataHora.toISOString(),
      finalizado: false,
      ordem_na_fase: i + 1
    });
    totalSalvos++;

    temposQuadras[bestQuadraIdx] = endTime;
    const restTime = earliestStartTime + (MATCH_DURATION + REST_MINUTES) * 60000;
    teamFreeTime[m.ta] = restTime;
    teamFreeTime[m.tb] = restTime;
  }

  await logAction((session.user as any).id, "GERAR_CHAVEAMENTO", { modalidade, grupos: numGrupos, jogos: totalSalvos });
  return NextResponse.json({ success: true, grupos: numGrupos, jogos: totalSalvos });
}

