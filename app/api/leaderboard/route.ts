import { NextResponse } from "next/server"
import { getClerkId } from "@/lib/auth"
import { getLeaderboardPage } from "@/lib/leaderboard"

export async function GET(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const page = Math.max(1, Number.parseInt(new URL(req.url).searchParams.get("page") ?? "1", 10) || 1)
  const { pilots, hasNext } = await getLeaderboardPage(page)
  return NextResponse.json({ pilots, page, hasNext })
}
