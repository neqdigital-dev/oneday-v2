import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password)
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });

    const sb = supabaseAdmin();
    const { data: existUser } = await sb.from("users").select("id").eq("username", username).maybeSingle();
    if (existUser) return NextResponse.json({ error: "Nome de usuário já em uso." }, { status: 400 });
    const { data: existEmail } = await sb.from("users").select("id").eq("email", email).maybeSingle();
    if (existEmail) return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);
    const { data, error } = await sb.from("users").insert({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hash,
      role: "lider",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, user: { id: data.id, username: data.username } });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
