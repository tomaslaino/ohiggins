// Exposes NextAuth endpoints: /api/auth/signin, /api/auth/signout, /api/auth/session, etc.
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
