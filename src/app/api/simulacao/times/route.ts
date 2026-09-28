import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logAction } from "@/lib/audit";

const nomes = [
  'Igreja Batista', 'AD Madureira', 'Comunidade Vida',
  'Igreja Presbiteriana', 'AD Belem', 'Metodista',
  'Comunidade Shalom', 'Batista da Paz', 'AD Vitoria',
  'Sara Nossa Terra', 'Primeira Batista', 'Nacoes',
  'Maranata', 'Boas Novas', 'Quadrangular', 'Zona Sul',
  'Central', 'Renovacao', 'Hebrom', 'Betel'
];

const primeirosNomes = ["João", "Pedro", "Lucas", "Mateus", "Marcos", "Paulo", "Filipe", "Tiago", "André", "Davi", "Samuel", "José", "Daniel", "Gabriel", "Rafael", "Miguel", "Elias", "Caio", "Felipe", "Bruno", "Diego", "Rodrigo", "Fernando", "Gustavo", "Eduardo", "Thiago", "Vitor", "Alexandre", "Marcelo", "Ricardo"];
const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"];

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
    
    // Inserir Time
    const { data: time, error } = await sb.from("times").insert({
      campeonato_id: camp.id,
      nome_igreja: nome,
      nome_base: "Base " + (i+1),
      modalidade,
      lider_id: (session.user as any).id, 
      diretor_jovem: "Lider Teste " + (i+1),
      token: crypto.randomUUID(),
      pagou: true
    }).select("id").single();

    if (!error && time) {
      criados++;
      // Inserir Jogadores para o Time
      const numJogadores = modalidade.toLowerCase().includes("vôlei") ? 6 : 10;
      const jogadores = [];
      for (let j = 0; j < numJogadores; j++) {
        const pNome = primeirosNomes[Math.floor(Math.random() * primeirosNomes.length)];
        const sNome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        jogadores.push({
          time_id: time.id,
          nome: pNome + " " + sNome,
          rg: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          nascimento: "2000-01-01"
        });
      }
      await sb.from("jogadores").insert(jogadores);
    }
  }

  await logAction((session.user as any).id, "GERAR_TIMES_TESTE", { modalidade, quantidade: criados });
  return NextResponse.json({ success: true, criados });
}
