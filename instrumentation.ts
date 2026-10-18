export async function register() {
  // Skip the Edge runtime and `next build`, which run without production secrets.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return
  const { validateEnv } = await import("@/lib/env")
  const problems = validateEnv()
  if (problems.length > 0) {
    console.error(`[env] Invalid or missing environment variables:\n  ${problems.join("\n  ")}`)
  }
}
