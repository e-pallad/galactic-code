import { type NextRequest, NextResponse } from "next/server"
import { resetDemoUser } from "@/lib/demo"
import { demoRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown"
  const { success } = await demoRateLimit.limit(ip)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  try {
    await resetDemoUser()
  } catch (err) {
    console.error("[demo/reset] resetDemoUser failed:", err)
    return NextResponse.json({ error: "Demo reset failed" }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("gc_demo", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  res.cookies.set("gc_onboarding", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  return res
}
