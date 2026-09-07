import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "super_admin") return NextResponse.json({ error: "Apenas Super Admin pode criar campeonatos." }, { status: 403 });

  const sb = supabaseAdmin();
  const { nome, ano, regioes } = await req.json();

  if (!nome || !ano) return NextResponse.json({ error: "Nome e ano são obrigatórios." }, { status: 400 });

  // Arquivar todos os campeonatos ativos
  await sb.from("campeonatos").update({ status: "arquivado" }).eq("status", "ativo");

  // Criar novo campeonato
  const { data: camp, error } = await sb.from("campeonatos").insert({
    nome,
    ano: parseInt(ano),
    status: "ativo",
    criado_por_id: (session.user as any).id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Criar configuração padrão
  await sb.from("configuracao").insert({ campeonato_id: camp.id });

  // Criar regiões
  if (regioes && regioes.length > 0) {
    await sb.from("regioes").insert(regioes.map((r: any) => ({ ...r, campeonato_id: camp.id })));
  }

  return NextResponse.json(camp, { status: 201 });
}
