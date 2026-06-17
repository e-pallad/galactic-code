import { type NextRequest, NextResponse } from "next/server"
import { resetDemoUser } from "@/lib/demo"
import { demoRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown"
  const { success } = await demoRateLimit.limit(ip)
  if (!success) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin))
  }

  try {
    await resetDemoUser()
  } catch (err) {
    console.error("[demo] resetDemoUser failed:", err)
    return NextResponse.redirect(new URL("/?demo_error=1", req.nextUrl.origin))
  }

  const res = NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  res.cookies.set("gc_demo", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  res.cookies.set("gc_onboarding", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  return res
}
