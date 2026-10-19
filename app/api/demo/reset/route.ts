import { type NextRequest, NextResponse } from "next/server"
import { resetDemoUser } from "@/lib/demo"
import { demoRateLimit, clientIp } from "@/lib/rate-limit"
import { DEMO_COOKIE, DEMO_COOKIE_MAX_AGE, newDemoSessionId, parseDemoSession } from "@/lib/demo-session"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { success } = await demoRateLimit.limit(await clientIp())
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const sessionId = parseDemoSession(req.cookies.get(DEMO_COOKIE)?.value) ?? newDemoSessionId()

  try {
    await resetDemoUser(sessionId)
  } catch (err) {
    console.error("[demo/reset] resetDemoUser failed:", err)
    return NextResponse.json({ error: "Demo reset failed" }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(DEMO_COOKIE, sessionId, { path: "/", sameSite: "lax", httpOnly: true, maxAge: DEMO_COOKIE_MAX_AGE })
  res.cookies.set("gc_onboarding", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: DEMO_COOKIE_MAX_AGE })
  return res
}
