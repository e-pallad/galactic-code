import { NextResponse } from "next/server"
import { resetDemoUser } from "@/lib/demo"
import { demoRateLimit, clientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST() {
  const { success } = await demoRateLimit.limit(await clientIp())
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
