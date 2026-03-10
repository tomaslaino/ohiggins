/**
 * Runs once when the Next.js server starts (Node.js runtime).
 * Use for production env validation so the app fails fast if misconfigured.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
