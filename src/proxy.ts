import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as any)?.role;

  // Always public
  const publicPaths = ["/login", "/signup", "/esqueci-senha", "/painel", "/chaveamento", "/time", "/acesso-negado"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p)) || pathname === "/";
  if (isPublic) return NextResponse.next();

  // Not logged in
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  // Super Admin only
  if (pathname.startsWith("/super-admin") && role !== "super_admin")
    return NextResponse.redirect(new URL("/acesso-negado", req.url));

  // Admin and above
  if (pathname.startsWith("/admin") && !["super_admin", "admin"].includes(role))
    return NextResponse.redirect(new URL("/acesso-negado", req.url));

  // Placarista and above
  if (pathname.startsWith("/placar") && !["super_admin", "admin", "placarista"].includes(role))
    return NextResponse.redirect(new URL("/acesso-negado", req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
