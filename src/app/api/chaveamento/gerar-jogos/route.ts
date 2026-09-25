import { NextRequest, NextResponse } from "next/server";

function getTempoJanela(modalidade: string): number {
  const mod = modalidade.toLowerCase();
  if (mod.includes("futebol")) return 20; 
  if (mod.includes("vôlei") && mod.includes("feminino")) return 15; 
  if (mod.includes("vôlei") && mod.includes("masculino")) return 18; 
  if (mod.includes("tênis")) return 15; 
  return 20;
}
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

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
  const { modalidade, hora_inicio = "08:30", num_quadras = 1, tempo_jogo } = reqBody;

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });
  const campId = camp.id;

  // Apenas deletamos os jogos da fase de grupos para refazê-los
  await sb.from("games").delete().eq("campeonato_id", campId).eq("modalidade", modalidade).eq("fase", "Fase de Grupos");
  
  const { data: grupos } = await sb.from("grupos").select("*").eq("campeonato_id", campId).eq("modalidade", modalidade).order("nome");
  if (!grupos || grupos.length === 0) {
    return NextResponse.json({ error: "Nenhum grupo encontrado para esta modalidade. Gere os grupos primeiro." }, { status: 400 });
  }

  // Pegar times de cada grupo
  let todosConfrontos: any[] = [];
  for (const grupo of grupos) {
    const { data: classif } = await sb.from("classificacao").select("time_id").eq("grupo_id", grupo.id);
    if (!classif || classif.length < 2) continue;
    
    // extrai apenas os ids dos times
    const timesIds = classif.map(c => c.time_id);
    const confrontos = getCombinations(timesIds);
    for (const [ta, tb] of confrontos) {
      todosConfrontos.push({ grupo_id: grupo.id, ta: ta, tb: tb });
    }
  }

  if (todosConfrontos.length === 0) {
    return NextResponse.json({ error: "Não há times suficientes nos grupos para gerar jogos." }, { status: 400 });
  }

  const scheduledMatches: any[] = [];
  const ultimoJogo: Record<string, number> = {}; 
  
  // Organiza confrontos por grupo para fazer o rodízio (A -> B -> C -> D)
  const confrontosPorGrupo = new Map<number, any[]>();
  for (const g of grupos) {
    confrontosPorGrupo.set(g.id, todosConfrontos.filter(c => c.grupo_id === g.id));
  }

  let roundIndex = 0;
  while (true) {
    let matchesAgendadosNesteCiclo = 0;
    
    let gruposNestaRodada = [...grupos];
    // Se for Vôlei Masculino e rodada ímpar (ex: 2ª rodada), inverte os pares de grupos para trocar de quadra
    if (modalidade === "Vôlei Masculino" && roundIndex % 2 === 1) {
      if (gruposNestaRodada.length >= 2) {
        let temp = gruposNestaRodada[0]; gruposNestaRodada[0] = gruposNestaRodada[1]; gruposNestaRodada[1] = temp;
      }
      if (gruposNestaRodada.length >= 4) {
        let temp = gruposNestaRodada[2]; gruposNestaRodada[2] = gruposNestaRodada[3]; gruposNestaRodada[3] = temp;
      }
    }

    // Tenta pegar 1 jogo de cada grupo, em ordem
    for (let i = 0; i < gruposNestaRodada.length; i++) {
      const g = gruposNestaRodada[i];
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
    
    if (matchesAgendadosNesteCiclo === 0) break;
    roundIndex++;
  }

  // Agendamento
  const numQuadras = parseInt(num_quadras) || 1;
  const [hora, min] = hora_inicio.split(":").map(Number);
  const baseDate = new Date();
  baseDate.setUTCHours(hora + 3, min, 0, 0);

  const temposQuadras = Array(numQuadras).fill(baseDate.getTime());
  const teamFreeTime: Record<string, number> = {};
  const REST_MINUTES = 0; 
  const MATCH_DURATION = tempo_jogo ? parseInt(tempo_jogo) : getTempoJanela(modalidade);

  let totalSalvos = 0;

    const gamesToInsert = [];
  for (let i = 0; i < scheduledMatches.length; i++) {
    const m = scheduledMatches[i];

    const taFree = teamFreeTime[m.ta] || baseDate.getTime();
    const tbFree = teamFreeTime[m.tb] || baseDate.getTime();
    const teamsReadyAt = Math.max(taFree, tbFree);

    let bestQuadraIdx = 0;
    let earliestStartTime = Infinity;

    for (let q = 0; q < numQuadras; q++) {
      const actualStart = Math.max(temposQuadras[q], teamsReadyAt);
      if (actualStart < earliestStartTime) {
        earliestStartTime = actualStart;
        bestQuadraIdx = q;
      }
    }

    const dataHora = new Date(earliestStartTime);
    const endTime = earliestStartTime + MATCH_DURATION * 60000;

    let assignedLocal = numQuadras === 1 ? "Quadra 1" : "Quadra " + (bestQuadraIdx + 1);
    if ((modalidade === "Vôlei Masculino" || modalidade === "Tênis de Mesa") && numQuadras === 2) {
      assignedLocal = i % 2 === 0 ? "Quadra 1" : "Quadra 2";
    }

    gamesToInsert.push({
      campeonato_id: campId,
      modalidade,
      fase: "Fase de Grupos",
      time_a_id: m.ta,
      time_b_id: m.tb,
      local: assignedLocal,
      data_hora: dataHora.toISOString(),
      finalizado: false,
      ordem_na_fase: i + 1
    });
    
    temposQuadras[bestQuadraIdx] = endTime;
    const restTime = earliestStartTime + (MATCH_DURATION + REST_MINUTES) * 60000;
    teamFreeTime[m.ta] = restTime;
    teamFreeTime[m.tb] = restTime;
  }
  
  if (gamesToInsert.length > 0) {
    const { error } = await sb.from("games").insert(gamesToInsert);
    if (error) console.error('Insert error:', error);
    totalSalvos = gamesToInsert.length;
  }

  await logAction((session.user as any).id, "GERAR_JOGOS", { modalidade, jogos: totalSalvos });
  return NextResponse.json({ success: true, jogos: totalSalvos });
}
