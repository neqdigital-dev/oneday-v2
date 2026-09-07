import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: any) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });

    const sb = supabaseAdmin();
    const { data: user } = await sb.from("users").select("id").eq("email", email).single();
    
    if (!user) {
      return NextResponse.json({ message: "Se o e-mail existir, um link foi enviado." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000).toISOString(); 

    await sb.from("users").update({ reset_token: token, reset_token_expires: expires }).eq("id", user.id);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'onedaycampeonato@gmail.com',
        pass: 'sylk zrtz jffx wtxm' 
      }
    });

    const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3005"}/redefinir-senha?token=${token}`;

    await transporter.sendMail({
      from: '"OneDay" <onedaycampeonato@gmail.com>',
      to: email,
      subject: "Recuperação de Senha - OneDay",
      html: `<p>Você solicitou a recuperação de senha.</p><p>Clique no link abaixo para redefinir sua senha:</p><a href="${resetLink}">${resetLink}</a><p>Este link é válido por 1 hora.</p>`
    });

    return NextResponse.json({ message: "Link de recuperação enviado para o seu e-mail." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
