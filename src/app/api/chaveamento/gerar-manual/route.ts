import { NextRequest, NextResponse } from "next/server";
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
  const { modalidade, hora_inicio = "08:30", grupos_manuais = [] } = reqBody;

  if (!grupos_manuais || grupos_manuais.length === 0) {
    return NextResponse.json({ error: "Nenhum grupo configurado." }, { status: 400 });
  }

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
  
  const grupos: any[] = [];
  
  // Criar os grupos e colocar os times
  for (const gm of grupos_manuais) {
    const { data: g } = await sb.from("grupos").insert({
      campeonato_id: campId,
      nome: gm.nome,
      modalidade,
    }).select().single();
    
    if (g) {
      grupos.push(g);
      for (const timeId of gm.times) {
        await sb.from("times").update({ grupo_id: g.id }).eq("id", timeId);
        await sb.from("classificacao").insert({ campeonato_id: campId, time_id: timeId, grupo_id: g.id });
      }
    }
  }

  // ALGORITMO DE AGENDAMENTO (DESCANSO) - Sequência Única (Rodízio de Grupos)
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
  const ultimoJogo: Record<string, number> = {};
  
  const confrontosPorGrupo = new Map<number, any[]>();
  for (const g of grupos) {
    confrontosPorGrupo.set(g.id, todosConfrontos.filter(c => c.grupo_id === g.id));
  }

  let grupoIndex = 0;
  while (true) {
    let matchesAgendadosNesteCiclo = 0;
    
    for (let i = 0; i < grupos.length; i++) {
      const g = grupos[(grupoIndex + i) % grupos.length];
      const matchesDoGrupo = confrontosPorGrupo.get(g.id) || [];
      
      if (matchesDoGrupo.length === 0) continue;
      
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
  }

  // Inserir no Banco de Dados
  const num_quadras = reqBody.num_quadras ? parseInt(reqBody.num_quadras) : 1;
  const [hora, min] = hora_inicio.split(":").map(Number);
  const baseDate = new Date();
  baseDate.setHours(hora, min, 0, 0);

  const temposQuadras = Array(num_quadras).fill(baseDate.getTime());
  const teamFreeTime: Record<string, number> = {};
  const REST_MINUTES = 15;
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

  await logAction((session.user as any).id, "GERAR_CHAVEAMENTO_MANUAL", { modalidade, grupos: grupos.length, jogos: totalSalvos });
  return NextResponse.json({ success: true, grupos: grupos.length, jogos: totalSalvos });
}
