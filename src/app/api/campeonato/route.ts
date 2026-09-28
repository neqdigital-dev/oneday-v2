import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("campeonatos").select("*").order("criado_em", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID não informado" }, { status: 400 });

  const sb = supabaseAdmin();
  
  // Excluir os registros dependentes primeiro para evitar erro de FK
  await sb.from("games").delete().eq("campeonato_id", id);
  await sb.from("classificacao").delete().eq("campeonato_id", id);
  await sb.from("grupos").delete().eq("campeonato_id", id);
  await sb.from("configuracao").delete().eq("campeonato_id", id);
  await sb.from("regioes").delete().eq("campeonato_id", id);
  await sb.from("times").delete().eq("campeonato_id", id);
  
  const { error } = await sb.from("campeonatos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAction((session.user as any).id, "EXCLUIR_CAMPEONATO", { campeonato_id: id });
  return NextResponse.json({ success: true });
}
