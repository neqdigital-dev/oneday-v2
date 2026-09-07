import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

const nomes = [
  'Igreja Batista', 'AD Madureira', 'Comunidade Vida',
  'Igreja Presbiteriana', 'AD Belem', 'Metodista',
  'Comunidade Shalom', 'Batista da Paz', 'AD Vitoria',
  'Sara Nossa Terra', 'Primeira Batista', 'Nacoes',
  'Maranata', 'Boas Novas', 'Quadrangular', 'Zona Sul'
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { modalidade, quantidade = 12 } = await req.json();

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });

  let criados = 0;
  for (let i = 0; i < quantidade; i++) {
    const nome = nomes[i % nomes.length] + (i >= nomes.length ? " " + (Math.floor(i/nomes.length)+1) : "") + " (Teste)";
    const { error } = await sb.from("times").insert({
      campeonato_id: camp.id,
      nome,
      modalidade,
      responsavel: "Lider Teste " + (i+1),
      telefone: "21999990" + String(i).padStart(3, "0"),
      pagou: true
    });
    if (!error) criados++;
  }

  await logAction((session.user as any).id, "GERAR_TIMES_TESTE", { modalidade, quantidade: criados });
  return NextResponse.json({ success: true, criados });
}
