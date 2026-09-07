import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: any) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < 6) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    const sb = supabaseAdmin();
    const { data: user } = await sb.from("users").select("id, reset_token_expires").eq("reset_token", token).single();
    
    if (!user) return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    
    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "O token expirou. Solicite um novo link." }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    await sb.from("users").update({ password_hash: hash, reset_token: null, reset_token_expires: null }).eq("id", user.id);

    return NextResponse.json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
