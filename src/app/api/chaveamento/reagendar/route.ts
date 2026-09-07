import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { modalidade, num_quadras, hora_inicio } = await req.json();
  const numQuadras = parseInt(num_quadras) || 1;

  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  // Pega apenas jogos NÃO FINALIZADOS, ordenados pela ordem que deveriam acontecer
  const { data: jogos, error } = await sb.from("games")
    .select("*")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .eq("finalizado", false)
    .order("data_hora", { ascending: true });

  if (error || !jogos || jogos.length === 0) {
    return NextResponse.json({ error: "Nenhum jogo pendente encontrado." }, { status: 400 });
  }

  const baseDate = new Date(); // Data de hoje
  const [hh, mm] = hora_inicio.split(":").map(Number);
  baseDate.setHours(hh, mm, 0, 0);

  // Distribuir nos novos slots
  const duracaoMinutos = modalidade.includes("futebol") ? 30 : 45;
  const temposQuadras = Array(numQuadras).fill(new Date(baseDate).getTime());

  let reagendados = 0;

  for (const jogo of jogos) {
    // Acha a quadra com o menor tempo (que desocupa primeiro)
    let quadraIndice = 0;
    let menorTempo = temposQuadras[0];
    for (let i = 1; i < numQuadras; i++) {
      if (temposQuadras[i] < menorTempo) {
        menorTempo = temposQuadras[i];
        quadraIndice = i;
      }
    }

    const novaDataHora = new Date(menorTempo);
    const novoLocal = "Quadra " + (quadraIndice + 1);

    await sb.from("games").update({
      data_hora: novaDataHora.toISOString(),
      local: novoLocal
    }).eq("id", jogo.id);

    reagendados++;
    // Adiciona o tempo da partida para a próxima vez que a quadra ficar livre
    temposQuadras[quadraIndice] += duracaoMinutos * 60000;
  }

  await logAction((session.user as any).id, "PLANO_CHUVA_REAGENDAR", { modalidade, num_quadras: numQuadras, hora_inicio, reagendados });
  return NextResponse.json({ success: true, reagendados });
}
