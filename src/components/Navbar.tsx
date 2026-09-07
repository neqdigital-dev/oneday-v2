"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  placarista: "Placarista",
  lider: "Líder",
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "role-super-admin",
  admin: "role-admin",
  placarista: "role-placarista",
  lider: "role-lider",
};

function getNavLinks(role?: UserRole) {
  const base = [
    { href: "/painel", label: "Painel" },
    { href: "/chaveamento", label: "Chaveamento" },
  ];
  if (!role) return base;
  if (role === "super_admin") {
    return [
      { href: "/super-admin/dashboard", label: "Dashboard" },
      { href: "/admin/painel-admin", label: "Painel Admin" },
      { href: "/placar", label: "Placar" },
      ...base,
    ];
  }
  if (role === "admin") {
    return [
      { href: "/admin/painel-admin", label: "Painel Admin" },
      { href: "/placar", label: "Placar" },
      ...base,
    ];
  }
  if (role === "placarista") {
    return [{ href: "/placar", label: "Placar" }, ...base];
  }
  return [{ href: "/meus-times", label: "Meus Times" }, ...base];
}

export default function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as UserRole | undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const links = getNavLinks(role);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">⚽ OneDay</Link>

        <div className="navbar-links hidden-mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="navbar-link">{l.label}</Link>
          ))}
          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0.75rem" }}>
              {role && (
                <span className={`badge ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
              )}
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{session.user.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                Sair
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm" style={{ marginLeft: "0.5rem" }}>Entrar</Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="btn btn-ghost btn-sm hidden-desktop"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="container hidden-desktop" style={{ paddingTop: "0.75rem", paddingBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="navbar-link" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {session?.user ? (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: "0.5rem", justifyContent: "flex-start" }} onClick={() => signOut({ callbackUrl: "/login" })}>
              Sair
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm" style={{ marginTop: "0.5rem" }}>Entrar</Link>
          )}
        </div>
      )}
    </nav>
  );
}
