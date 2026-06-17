import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fleetMembers } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function PATCH(req: Request, { params }: { params: Promise<{ fleetId: string }> }) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const { fleetId } = await params
  const body = await req.json() as unknown
  const parsed = z.object({
    targetUserId: z.string().uuid(),
    role: z.enum(["officer", "pilot"]),
  }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [myMembership] = await db.select().from(fleetMembers)
    .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, user.id)))
    .limit(1)
  if (!myMembership || myMembership.role !== "captain") return NextResponse.json({ error: "Only captains can change roles" }, { status: 403 })

  await db.update(fleetMembers).set({ role: parsed.data.role })
    .where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.userId, parsed.data.targetUserId)))

  return NextResponse.json({ success: true })
}
