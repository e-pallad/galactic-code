import { NextResponse } from "next/server"
import { resetDemoUser } from "@/lib/demo"

export const dynamic = "force-dynamic"

// Used by e2e tests to reset demo state and get a fresh session cookie
export async function POST() {
  await resetDemoUser()
  const res = NextResponse.json({ ok: true })
  res.cookies.set("gc_demo", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  res.cookies.set("gc_onboarding", "1", { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 2 })
  return res
}
