import { supabaseAdmin } from "./supabase";

export async function logAction(userId: string | undefined, acao: string, detalhes?: any) {
  try {
    const sb = supabaseAdmin();
    await sb.from("logs_auditoria").insert({
      usuario_id: userId || null,
      acao,
      detalhes
    });
  } catch (error) {
    console.error("Failed to log action", error);
  }
}
