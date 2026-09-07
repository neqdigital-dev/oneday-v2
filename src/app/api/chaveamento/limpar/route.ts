import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if ((session.user as any).role !== "super_admin") return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });

  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  await sb.from("games").delete().eq("campeonato_id", camp.id);
  await sb.from("classificacao").delete().eq("campeonato_id", camp.id);
  await sb.from("grupos").delete().eq("campeonato_id", camp.id);
  await sb.from("times").update({ grupo_id: null }).eq("campeonato_id", camp.id);

  await logAction((session.user as any).id, "LIMPAR_CHAVEAMENTO", {});
  return NextResponse.json({ success: true });
}

