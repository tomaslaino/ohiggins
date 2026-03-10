// Protects all app routes. Redirects to /login if not authenticated.
// Admin-only routes redirect non-admins to dashboard.
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/registro";
  const isHome = path === "/";

  if (isAuthPage) {
    if (isLoggedIn) return Response.redirect(new URL("/dashboard", req.url));
    return;
  }

  if (isHome) {
    if (isLoggedIn) return Response.redirect(new URL("/dashboard", req.url));
    return Response.redirect(new URL("/login", req.url));
  }

  const protectedPaths = ["/dashboard", "/panel", "/entradas", "/nueva", "/configuracion", "/usuarios", "/cuenta"];
  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(p + "/"));
  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }

  const adminPaths = ["/usuarios"];
  const isAdminPath = adminPaths.some((p) => path.startsWith(p));
  const role = req.auth?.user?.role;
  if (isAdminPath && role !== "ADMIN") {
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/", "/login", "/registro", "/dashboard/:path*", "/panel/:path*", "/entradas/:path*", "/nueva", "/configuracion", "/usuarios/:path*", "/cuenta"],
};
