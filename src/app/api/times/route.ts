import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateToken } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const campeonatoId = searchParams.get("campeonato_id");
  const modalidade = searchParams.get("modalidade");

  let query = sb.from("times").select("*, jogadores(*), classificacao(*)").order("nome_igreja");
  if (campeonatoId) query = query.eq("campeonato_id", parseInt(campeonatoId));
  else {
    const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
    if (camp) query = query.eq("campeonato_id", camp.id);
  }
  if (modalidade) query = query.eq("modalidade", modalidade);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sb = supabaseAdmin();
  const body = await req.json();

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  const { data, error } = await sb.from("times").insert({
    ...body,
    campeonato_id: camp.id,
    lider_id: (session.user as any).id,
    token: crypto.randomUUID(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
