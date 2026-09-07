import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const campeonatoId = searchParams.get("campeonato_id");
  const finalizado = searchParams.get("finalizado");
  const modalidade = searchParams.get("modalidade");

  let query = sb.from("games").select("*, time_a:times!games_time_a_id_fkey(*), time_b:times!games_time_b_id_fkey(*), vencedor:times!games_vencedor_id_fkey(*)").order("ordem_na_fase");

  if (campeonatoId) query = query.eq("campeonato_id", parseInt(campeonatoId));
  else {
    const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
    if (camp) query = query.eq("campeonato_id", camp.id);
  }
  if (finalizado !== null && finalizado !== undefined) query = query.eq("finalizado", finalizado === "true");
  if (modalidade) query = query.eq("modalidade", modalidade);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
