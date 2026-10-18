import { NextResponse } from "next/server"
import { getClerkId } from "@/lib/auth"
import { getUser } from "@/lib/missions"

export const dynamic = "force-dynamic"

/**
 * The middleware only sees the `gc_onboarding` cookie. A pilot who already
 * finished onboarding but is missing it (new device, cleared cookies) lands on
 * /onboarding; the layout there sends them here to restore the cookie from the
 * database flag instead of making them go through the questions again.
 */
export async function GET(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.redirect(new URL("/sign-in", req.url))
  const user = await getUser(clerkId)

  if (!user?.onboardingCompleted) return NextResponse.redirect(new URL("/onboarding", req.url))

  const response = NextResponse.redirect(new URL("/dashboard", req.url))
  response.cookies.set("gc_onboarding", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" })
  return response
}
