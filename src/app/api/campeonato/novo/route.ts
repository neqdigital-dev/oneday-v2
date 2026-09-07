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
  const body = await req.json();
  
  await sb.from("campeonatos").update({ status: "arquivado" }).eq("status", "ativo");
  const { data: newCamp, error } = await sb.from("campeonatos").insert({ nome: body.nome, ano: body.ano, status: "ativo" }).select().single();
  if (error || !newCamp) return NextResponse.json({ error: error?.message || "Erro ao criar campeonato." }, { status: 500 });
  
  await sb.from("configuracao").insert({ campeonato_id: newCamp.id, cadastros_abertos: true });
  if (body.regioes && body.regioes.length > 0) {
    const regioesToInsert = body.regioes.map((r: any) => ({ nome: r.nome, descricao: r.descricao, campeonato_id: newCamp.id }));
    await sb.from("regioes").insert(regioesToInsert);
  }

  await logAction(user.id, "CRIAR_CAMPEONATO", { nome: body.nome, ano: body.ano, campeonato_id: newCamp.id });

  return NextResponse.json(newCamp, { status: 201 });
}
