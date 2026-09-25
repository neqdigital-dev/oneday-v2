import { NextRequest, NextResponse } from "next/server";

function getTempoJanela(modalidade: string, isMataMata: boolean = false): number {
  const mod = modalidade.toLowerCase();
  if (mod.includes("futebol")) return 20; 
  if (isMataMata) {
    if (mod.includes("vôlei")) return 30; 
    if (mod.includes("tênis")) return 20;
  }
  if (mod.includes("vôlei") && mod.includes("feminino")) return 15; 
  if (mod.includes("vôlei") && mod.includes("masculino")) return 18; 
  if (mod.includes("tênis")) return 15; 
  return 20;
}
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { modalidade, num_quadras, hora_inicio, jogo_ids } = await req.json();
  const numQuadras = parseInt(num_quadras) || 1;

  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  // Se jogo_ids foi fornecido, reagendar apenas esses jogos (na ordem em que vieram)
  let jogosParaReagendar: any[] = [];

  if (jogo_ids && Array.isArray(jogo_ids) && jogo_ids.length > 0) {
    // Busca os jogos pelos IDs fornecidos
    const { data: jogos, error } = await sb.from("games")
      .select("*")
      .in("id", jogo_ids)
      .order("ordem_na_fase", { ascending: true });

    if (error || !jogos || jogos.length === 0) {
      return NextResponse.json({ error: "Nenhum jogo encontrado com os IDs fornecidos." }, { status: 400 });
    }
    jogosParaReagendar = jogos;
  } else {
    // Fallback: pega todos os jogos NÃO FINALIZADOS
    const { data: jogos, error } = await sb.from("games")
      .select("*")
      .eq("campeonato_id", camp.id)
      .eq("modalidade", modalidade)
      .eq("finalizado", false)
      .order("ordem_na_fase", { ascending: true });

    if (error || !jogos || jogos.length === 0) {
      return NextResponse.json({ error: "Nenhum jogo pendente encontrado." }, { status: 400 });
    }
    jogosParaReagendar = jogos;
  }

  const baseDate = new Date();
  const [hh, mm] = hora_inicio.split(":").map(Number);
  baseDate.setUTCHours(hh + 3, mm, 0, 0);

  // Distribuir nos novos slots
  const REST_MINUTES = 0;
  const temposQuadras = Array(numQuadras).fill(baseDate.getTime());
  const teamFreeTime: Record<string, number> = {};

  let reagendados = 0;

  for (const jogo of jogosParaReagendar) {
    const isMataMata = ["Quartas de Final", "Semifinal", "Final"].includes(jogo.fase);
    const duracaoMinutos = getTempoJanela(modalidade, isMataMata);
    // Calcular quando os dois times estão livres
    const taFree = teamFreeTime[jogo.time_a_id] || baseDate.getTime();
    const tbFree = teamFreeTime[jogo.time_b_id] || baseDate.getTime();
    const teamsReadyAt = Math.max(taFree, tbFree);

    // Achar a quadra que desocupa primeiro E respeita o descanso dos times
    let bestQuadraIdx = 0;
    let earliestStartTime = Infinity;

    for (let q = 0; q < numQuadras; q++) {
      const actualStart = Math.max(temposQuadras[q], teamsReadyAt);
      if (actualStart < earliestStartTime) {
        earliestStartTime = actualStart;
        bestQuadraIdx = q;
      }
    }

    const novaDataHora = new Date(earliestStartTime);
    const novoLocal = numQuadras === 1 ? "Quadra 1" : "Quadra " + (bestQuadraIdx + 1);
    const endTime = earliestStartTime + duracaoMinutos * 60000;

    await sb.from("games").update({
      data_hora: novaDataHora.toISOString(),
      local: novoLocal
    }).eq("id", jogo.id);

    reagendados++;

    // Atualizar quando a quadra e os times ficam livres
    temposQuadras[bestQuadraIdx] = endTime;
    const restTime = earliestStartTime + (duracaoMinutos + REST_MINUTES) * 60000;
    if (jogo.time_a_id) teamFreeTime[jogo.time_a_id] = restTime;
    if (jogo.time_b_id) teamFreeTime[jogo.time_b_id] = restTime;
  }

  await logAction((session.user as any).id, "PLANO_CHUVA_REAGENDAR", { modalidade, num_quadras: numQuadras, hora_inicio, reagendados });
  return NextResponse.json({ success: true, reagendados });
}
