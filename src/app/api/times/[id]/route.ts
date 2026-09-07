import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("times").select("*, jogadores(*), classificacao(*), grupos(*)").eq("id", parseInt(id)).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sb = supabaseAdmin();
  const body = await req.json();
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const { data: time } = await sb.from("times").select("lider_id").eq("id", parseInt(id)).single();
  if (!time) return NextResponse.json({ error: "Time não encontrado." }, { status: 404 });
  if (role !== "super_admin" && role !== "admin" && time.lider_id !== userId)
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { data, error } = await sb.from("times").update(body).eq("id", parseInt(id)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (!["super_admin", "admin"].includes(role))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const sb = supabaseAdmin();
  const { error } = await sb.from("times").delete().eq("id", parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
