import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  
  const role = (session.user as any).role;
  // Placaristas ou Super Admins podem fazer checkin
  if (role !== "placarista" && role !== "super_admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id, check_in } = await req.json();
  if (!id) return NextResponse.json({ error: "ID do jogador não informado." }, { status: 400 });

  const sb = supabaseAdmin();
  const { error } = await sb.from("jogadores").update({ check_in }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
