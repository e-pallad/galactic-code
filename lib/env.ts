import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = schema.parse(process.env)
