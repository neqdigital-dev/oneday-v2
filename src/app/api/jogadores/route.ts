import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sb = supabaseAdmin();
  const body = await req.json();
  const { time_id } = body;

  // Verify ownership
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!["super_admin", "admin"].includes(role)) {
    const { data: time } = await sb.from("times").select("lider_id, campeonato_id, cadastros_encerrados").eq("id", time_id).single();
    if (!time) return NextResponse.json({ error: "Time não encontrado." }, { status: 404 });
    if (time.lider_id !== userId) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    if (time.cadastros_encerrados) return NextResponse.json({ error: "Cadastros encerrados." }, { status: 400 });
  }

  const { data: time } = await sb.from("times").select("campeonato_id").eq("id", time_id).single();
  const { data, error } = await sb.from("jogadores").insert({ ...body, campeonato_id: time?.campeonato_id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
