import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "super_admin") return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });

  const sb = supabaseAdmin();
  const reqBody = await req.json();
  const { modalidade } = reqBody;

  if (!modalidade) return NextResponse.json({ error: "Modalidade obrigatória." }, { status: 400 });

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });
  const campId = camp.id;

  // Apaga apenas os jogos (todas as fases) desta modalidade
  const { error } = await sb.from("games").delete().eq("campeonato_id", campId).eq("modalidade", modalidade);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Zera as estatísticas na tabela classificacao (pois os jogos foram apagados)
  const { data: grupos } = await sb.from("grupos").select("id").eq("campeonato_id", campId).eq("modalidade", modalidade);
  if (grupos && grupos.length > 0) {
    for (const g of grupos) {
      await sb.from("classificacao").update({
        jogos_disputados: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        gols_pro: 0,
        gols_contra: 0
      }).eq("grupo_id", g.id);
    }
  }

  await logAction((session.user as any).id, "LIMPAR_JOGOS", { modalidade });
  return NextResponse.json({ success: true });
}
