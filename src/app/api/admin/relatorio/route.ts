import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const role = (session.user as any).role;
  if (!["super_admin", "admin"].includes(role)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("id, nome").eq("status", "ativo").single();
  if (!camp) return NextResponse.json({ error: "Sem campeonato ativo." }, { status: 400 });

  const { data: times } = await sb.from("times").select("*").eq("campeonato_id", camp.id).order("nome_igreja");
  const { data: jogadores } = await sb.from("jogadores").select("*, times(nome_igreja, modalidade, distrito, nome_base)").eq("campeonato_id", camp.id).order("nome_completo");

  const wb = XLSX.utils.book_new();

  // Aba Times
  const timesData = (times || []).map((t: any) => ({
    "Nome da Igreja": t.nome_igreja,
    "Diretor Jovem": t.diretor_jovem || "",
    "Distrito": t.distrito || "",
    "Região": t.regiao || "",
    "Nome da Base": t.nome_base || "",
    "Modalidade": t.modalidade,
    "Pagamento Confirmado": t.pagou ? "Sim" : "Não",
    "Cadastro Encerrado": t.cadastros_encerrados ? "Sim" : "Não",
    "Comprovante (Link)": t.comprovante_url || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timesData), "Times Cadastrados");

  // Aba Jogadores
  const jogadoresData = (jogadores || []).map((j: any) => ({
    "Nome do Jogador": j.nome_completo,
    "Telefone": j.telefone,
    "CPF": j.cpf || "",
    "RG": j.rg || "",
    "Data de Nascimento": j.data_nascimento ? new Date(j.data_nascimento).toLocaleDateString("pt-BR") : "",
    "É Adventista?": j.is_adventista ? "Sim" : "Não",
    "É Capitão?": j.is_capitao ? "Sim" : "Não",
    "Modalidade": j.times?.modalidade || "",
    "Nome da Igreja": j.times?.nome_igreja || "",
    "Distrito": j.times?.distrito || "",
    "Nome da Base": j.times?.nome_base || "",
    "Foto (Link)": j.foto_url || "",
    "Identidade (Link)": j.foto_identidade_url || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jogadoresData), "Jogadores Inscritos");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `relatorio_${camp.nome.replace(/\s/g, "_")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
