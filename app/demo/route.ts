import { type NextRequest, NextResponse } from "next/server"
import { resetDemoUser } from "@/lib/demo"
import { demoRateLimit } from "@/lib/rate-limit"
import { DEMO_COOKIE, DEMO_COOKIE_MAX_AGE, newDemoSessionId, parseDemoSession } from "@/lib/demo-session"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown"
  const { success } = await demoRateLimit.limit(ip)
  if (!success) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin))
  }

  // A returning visitor restarts their own pilot; everybody else gets a fresh one.
  const sessionId = parseDemoSession(req.cookies.get(DEMO_COOKIE)?.value) ?? newDemoSessionId()

  try {
    await resetDemoUser(sessionId)
  } catch (err) {
    console.error("[demo] resetDemoUser failed:", err)
    return NextResponse.redirect(new URL("/?demo_error=1", req.nextUrl.origin))
  }

  const res = NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  res.cookies.set(DEMO_COOKIE, sessionId, { path: "/", sameSite: "lax", httpOnly: true, maxAge: DEMO_COOKIE_MAX_AGE })
  res.cookies.set("gc_onboarding", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  return res
}
