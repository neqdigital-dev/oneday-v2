"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo" style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="OneDay" style={{ height: "45px", objectFit: "contain" }} />
        </Link>
        <div className="navbar-links" style={{ overflowX: "auto", whiteSpace: "nowrap", paddingRight: "1rem" }}>
          {role === "super_admin" && <Link href="/super-admin/dashboard" className="navbar-link">Super Admin</Link>}
                    {(role === "super_admin" || role === "admin" || role === "placarista") && <Link href="/placar" className="navbar-link">Placar</Link>}
          {role === "super_admin" ? <Link href="/super-admin/times" className="navbar-link">Times</Link> : (role === "admin" || role === "lider") ? <Link href="/meus-times" className="navbar-link">Meus Times</Link> : null}
          <Link href="/chaveamento" className="navbar-link">Chaveamento</Link>
          <Link href="/painel" className="navbar-link">Grupos</Link>
          <Link href="/podio" className="navbar-link">Pódio</Link>
          
          {session ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="navbar-link" style={{ background: "rgba(255,255,255,0.1)" }}>Sair</button>
          ) : (
            <Link href="/login" className="navbar-link" style={{ background: "rgba(255,255,255,0.1)" }}>Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
