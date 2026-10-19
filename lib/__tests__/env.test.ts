import { describe, it, expect } from "vitest"
import { validateEnv } from "@/lib/env"

const valid = {
  DATABASE_URL: "postgres://x",
  CLERK_SECRET_KEY: "sk",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk",
  CLERK_WEBHOOK_SECRET: "whsec",
  UPSTASH_REDIS_REST_URL: "https://redis.example.com",
  UPSTASH_REDIS_REST_TOKEN: "t",
  RESEND_API_KEY: "re",
  CRON_SECRET: "cron",
  NEXT_PUBLIC_APP_URL: "https://galacticcode.app",
}

describe("validateEnv", () => {
  it("accepts a complete environment, with ANTHROPIC_API_KEY optional", () => {
    expect(validateEnv(valid)).toEqual([])
  })

  it("names every missing or malformed variable", () => {
    const problems = validateEnv({ ...valid, CRON_SECRET: undefined, UPSTASH_REDIS_REST_URL: "nope" })
    expect(problems).toHaveLength(2)
    expect(problems.join("\n")).toContain("CRON_SECRET")
    expect(problems.join("\n")).toContain("UPSTASH_REDIS_REST_URL")
  })
})
