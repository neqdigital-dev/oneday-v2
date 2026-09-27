import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "super_admin") return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });

  const sb = supabaseAdmin();
  const { campeonato_id } = await req.json();
  
  if (!campeonato_id) return NextResponse.json({ error: "Campeonato não informado." }, { status: 400 });

  const { error } = await sb.from("campeonatos").update({ status: "arquivado" }).eq("id", campeonato_id);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  await logAction(user.id, "ENCERRAR_CAMPEONATO", { campeonato_id });

  return NextResponse.json({ success: true });
}
