/**
 * NextAuth configuration: credentials login + JWT session.
 * Validates email/password against the database and puts the user role in the session.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  }
  interface Session {
    user: User & { role?: string };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // required when deployed behind proxy (Vercel, etc.)
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        adminCode: { label: "Código de administrador", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.password);
        if (!ok) return null;
        // If user is admin, require admin code when ADMIN_CODE is set
        if (user.role === "ADMIN") {
          const expectedCode = process.env.ADMIN_CODE?.trim();
          if (expectedCode && expectedCode.length > 0) {
            const providedCode = String(credentials.adminCode ?? "").trim();
            if (providedCode !== expectedCode) return null;
          }
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
