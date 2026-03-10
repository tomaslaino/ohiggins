/**
 * Validates required environment variables. Call at app startup so production fails fast if misconfigured.
 */
function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function validateEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const authSecret = getEnv("AUTH_SECRET");
  if (!authSecret || authSecret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set in production (min 32 chars). Generate: openssl rand -base64 33"
    );
  }

  const url = getEnv("NEXTAUTH_URL");
  if (!url || !url.startsWith("https://")) {
    console.warn(
      "NEXTAUTH_URL should be set to your production URL (https://...) for NextAuth to work correctly."
    );
  }
}
