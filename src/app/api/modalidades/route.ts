import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("modalidades").select("*").order("nome");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { nome } = await req.json();
  if (!nome || typeof nome !== "string") {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const { data, error } = await sb.from("modalidades").insert({ nome: nome.trim() }).select().single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "Modalidade já existe." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAction((session.user as any).id, "CRIAR_MODALIDADE", { nome });
  return NextResponse.json(data);
}
