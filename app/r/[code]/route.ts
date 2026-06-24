import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"
  const response = NextResponse.redirect(`${APP_URL}/sign-up`)
  response.cookies.set("gc_ref", code.toUpperCase(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
  })
  return response
}
