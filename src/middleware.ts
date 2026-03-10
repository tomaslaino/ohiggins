// Lightweight middleware: only checks session cookie to stay under Vercel Edge 1 MB limit.
// Full auth and admin check happen in server components (e.g. usuarios page).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token", "next-auth.session-token", "__Secure-next-auth.session-token"];

function hasSession(req: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => req.cookies.get(name)?.value);
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const loggedIn = hasSession(req);
  const isAuthPage = path === "/login" || path === "/registro";
  const isHome = path === "/";

  if (isAuthPage) {
    if (loggedIn) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (isHome) {
    if (loggedIn) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const protectedPaths = ["/dashboard", "/panel", "/entradas", "/nueva", "/configuracion", "/usuarios", "/cuenta"];
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(p + "/"));
  if (isProtected && !loggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/registro", "/dashboard/:path*", "/panel/:path*", "/entradas/:path*", "/nueva", "/configuracion", "/usuarios/:path*", "/cuenta"],
};
