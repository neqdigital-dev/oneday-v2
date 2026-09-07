import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCombinations<T>(arr: T[]): [T, T][] {
  const result: [T, T][] = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      result.push([arr[i], arr[j]]);
  return result;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "super_admin") return NextResponse.json({ error: "Apenas Super Admin." }, { status: 403 });

  const sb = supabaseAdmin();
  const { modalidade, num_quadras, hora_inicio = "08:30" } = await req.json();

  const { data: camp } = await sb.from("campeonatos").select("id").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Nenhum campeonato ativo." }, { status: 400 });
  const campId = camp.id;

  // Limpar dados antigos desta modalidade
  await sb.from("games").delete().eq("campeonato_id", campId).eq("modalidade", modalidade);
  const { data: gruposAntigos } = await sb.from("grupos").select("id").eq("campeonato_id", campId).eq("modalidade", modalidade);
  if (gruposAntigos) {
    for (const g of gruposAntigos) {
      await sb.from("classificacao").delete().eq("grupo_id", g.id);
    }
    await sb.from("grupos").delete().eq("campeonato_id", campId).eq("modalidade", modalidade);
  }
  // Desassociar times dos grupos
  const { data: timesModal } = await sb.from("times").select("id").eq("campeonato_id", campId).eq("modalidade", modalidade).eq("pagou", true);
  if (!timesModal || timesModal.length < 3)
    return NextResponse.json({ error: "São necessários pelo menos 3 times pagantes." }, { status: 400 });

  const times = shuffle(timesModal);
  const numTimes = times.length;

  // Calcular número de grupos
  let numGrupos: number;
  if (numTimes >= 15) numGrupos = 4;
  else if (numTimes >= 12) numGrupos = 3;
  else numGrupos = Math.ceil(numTimes / 4);

  // Criar grupos
  const grupos: any[] = [];
  for (let i = 0; i < numGrupos; i++) {
    const { data: g } = await sb.from("grupos").insert({
      campeonato_id: campId,
      nome: `Grupo ${String.fromCharCode(65 + i)}`,
      modalidade,
    }).select().single();
    if (g) grupos.push(g);
  }

  // Distribuir times nos grupos (round-robin)
  for (let i = 0; i < times.length; i++) {
    const grupoIdx = i % numGrupos;
    await sb.from("times").update({ grupo_id: grupos[grupoIdx].id }).eq("id", times[i].id);
    await sb.from("classificacao").insert({
      campeonato_id: campId,
      time_id: times[i].id,
      grupo_id: grupos[grupoIdx].id,
    });
  }

  // Gerar jogos para cada grupo
  const [hora, min] = hora_inicio.split(":").map(Number);
  const baseDate = new Date();
  baseDate.setHours(hora, min, 0, 0);

  let jogoIndex = 0;
  for (const grupo of grupos) {
    const { data: timesDoGrupo } = await sb.from("times").select("id").eq("grupo_id", grupo.id);
    if (!timesDoGrupo) continue;
    const confrontos = shuffle(getCombinations(timesDoGrupo));
    for (const [ta, tb] of confrontos) {
      const quadra = (jogoIndex % num_quadras) + 1;
      const minutosOffset = Math.floor(jogoIndex / num_quadras) * 17;
      const dataHora = new Date(baseDate.getTime() + minutosOffset * 60000);
      await sb.from("games").insert({
        campeonato_id: campId,
        modalidade,
        fase: "Fase de Grupos",
        time_a_id: ta.id,
        time_b_id: tb.id,
        local: `Quadra ${quadra}`,
        data_hora: dataHora.toISOString(),
        finalizado: false,
        ordem_na_fase: jogoIndex + 1,
        grupo_id: grupo.id,
      });
      jogoIndex++;
    }
  }

  return NextResponse.json({ success: true, grupos: grupos.length, jogos: jogoIndex });
}

