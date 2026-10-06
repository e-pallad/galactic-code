import { NextResponse } from "next/server"
import { isDemo } from "@/lib/auth"
import { canAccess, getAccess, unlockRankForPath } from "@/lib/unlocks"

/**
 * Server-side counterpart to the rank-gated navigation: API routes for a locked
 * area answer 403 instead of trusting the UI to hide the entry point. Pass the
 * area's nav path (e.g. "/combat"); Explorer Mode and the demo pass through.
 * Returns a response to send back, or null when the pilot may proceed.
 */
export async function requireUnlock(
  user: { totalXp: number; explorerMode: boolean },
  path: string
): Promise<NextResponse | null> {
  const access = getAccess(user, await isDemo())
  const requiredRank = unlockRankForPath(path)
  if (canAccess(access, requiredRank)) return null
  return NextResponse.json({ error: "Area locked", requiredRank }, { status: 403 })
}
