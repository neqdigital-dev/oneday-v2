import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { modalidade } = await req.json();

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  // Buscar todos os jogos não finalizados
  const { data: jogos } = await sb.from("games")
    .select("id")
    .eq("campeonato_id", camp.id)
    .eq("modalidade", modalidade)
    .eq("finalizado", false);

  if (!jogos || jogos.length === 0) {
    return NextResponse.json({ error: "Nenhum jogo em aberto para simular." }, { status: 400 });
  }

  const isVolei = modalidade.includes("volei");
  let simulados = 0;

  for (const jogo of jogos) {
    let ga = 0, gb = 0, sa = 0, sb_sets = 0;
    
    if (isVolei) {
      // Volei: quem chega a 2 sets vence
      sa = Math.random() > 0.5 ? 2 : (Math.floor(Math.random() * 2));
      sb_sets = sa === 2 ? (Math.floor(Math.random() * 2)) : 2;
    } else {
      // Futebol ou Ping Pong: placares aleatorios
      ga = Math.floor(Math.random() * 4);
      gb = Math.floor(Math.random() * 4);
      // Evitar empate se for mata-mata (simplificacao)
    }

    const { error } = await sb.from("games").update({
      gols_time_a: ga,
      gols_time_b: gb,
      sets_vencidos_a: sa,
      sets_vencidos_b: sb_sets,
      finalizado: true
    }).eq("id", jogo.id);

    if (!error) simulados++;
  }

  await logAction((session.user as any).id, "SIMULAR_PLACARES", { modalidade, simulados });
  return NextResponse.json({ success: true, simulados });
}
