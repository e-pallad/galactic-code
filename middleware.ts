import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/offline",
  "/api/health",
  "/api/webhooks/clerk",
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId } = await auth()

  if (!userId) {
    const signIn = new URL("/sign-in", req.url)
    signIn.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signIn)
  }

  const onboardingDone = req.cookies.get("gc_onboarding")?.value === "1"
  const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding")
  const isDashboardRoute = !isOnboarding && !req.nextUrl.pathname.startsWith("/api")

  if (!onboardingDone && isDashboardRoute) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
