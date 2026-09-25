import { supabaseAdmin } from "@/lib/supabase";
import SumulasClient from "./SumulasClient";

export const dynamic = "force-dynamic";

export default async function SumulasPage() {
  const sb = supabaseAdmin();
  const { data: camp } = await sb.from("campeonatos").select("*").eq("status", "ativo").single();
  if (!camp) return <div style={{ padding: "40px", textAlign: "center" }}>Nenhum campeonato ativo.</div>;

  // We need to fetch all games to know which modalities and phases exist
  const { data: games } = await sb.from("games")
    .select("modalidade, fase")
    .eq("campeonato_id", camp.id);

  const modalitiesMap: Record<string, Set<string>> = {};
  
  if (games) {
    games.forEach((g: any) => {
      if (!modalitiesMap[g.modalidade]) {
        modalitiesMap[g.modalidade] = new Set();
      }
      if (g.fase) {
        modalitiesMap[g.modalidade].add(g.fase);
      }
    });
  }

  // Convert Set to Array
  const data = Object.keys(modalitiesMap).map(mod => ({
    modalidade: mod,
    fases: Array.from(modalitiesMap[mod])
  }));

  const modOrder = ["Futebol Masculino", "Tênis de Mesa", "Vôlei Feminino", "Vôlei Masculino"];
  data.sort((a, b) => {
    const idxA = modOrder.indexOf(a.modalidade);
    const idxB = modOrder.indexOf(b.modalidade);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.modalidade.localeCompare(b.modalidade);
  });

  // Sort phases to ensure "Fase de Grupos" is first, then "Quartas de Final", etc.
  const phaseOrder = ["Fase de Grupos", "Oitavas de Final", "Quartas de Final", "Semifinal", "Final", "Disputa 3º Lugar"];
  data.forEach(d => {
    d.fases.sort((a, b) => {
      const idxA = phaseOrder.indexOf(a);
      const idxB = phaseOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  });

  return <SumulasClient data={data} />;
}
