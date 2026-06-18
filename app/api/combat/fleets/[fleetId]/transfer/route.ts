import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleets, fleetMembers } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request, { params }: { params: Promise<{ fleetId: string }> }) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const { fleetId } = await params
  const body = await req.json() as unknown
  const parsed = z.object({ targetUserId: z.string().uuid() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  if (parsed.data.targetUserId === user.id) return NextResponse.json({ error: "You are already the captain" }, { status: 400 })

  // Caller must be this fleet's captain.
  const [myMembership] = await db.select().from(fleetMembers)
    .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, user.id)))
    .limit(1)
  if (!myMembership || myMembership.role !== "captain") {
    return NextResponse.json({ error: "Only the captain can transfer captaincy" }, { status: 403 })
  }

  // Target must be a member of this fleet.
  const [targetMembership] = await db.select().from(fleetMembers)
    .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, parsed.data.targetUserId)))
    .limit(1)
  if (!targetMembership) return NextResponse.json({ error: "Target is not a member of this fleet" }, { status: 404 })

  // Sequential updates — neon-http has no interactive transactions.
  await db.update(fleetMembers).set({ role: "captain" })
    .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, parsed.data.targetUserId)))
  await db.update(fleetMembers).set({ role: "officer" })
    .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, user.id)))
  await db.update(fleets).set({ captainUserId: parsed.data.targetUserId }).where(eq(fleets.id, fleetId))

  return NextResponse.json({ success: true })
}
