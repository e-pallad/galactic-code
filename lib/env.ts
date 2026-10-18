import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

/**
 * Checks the environment against the schema and returns the problems, one line
 * each. It reports instead of throwing: modules read `process.env` lazily on
 * purpose (builds and tests run without secrets), so this is for a loud startup
 * log (see instrumentation.ts), not a gate.
 */
export function validateEnv(source: Record<string, string | undefined> = process.env): string[] {
  const result = schema.safeParse(source)
  if (result.success) return []
  return result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
}
