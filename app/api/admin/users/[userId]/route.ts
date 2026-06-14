import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getRankFromXP } from "@/lib/xp"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  totalXp: z.number().int().min(0).optional(),
  role: z.enum(["user", "admin", "moderator"]).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await getUser(clerkId)
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId } = await params
  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const updates: Partial<typeof users.$inferInsert> = {}
  if (parsed.data.totalXp !== undefined) {
    updates.totalXp = parsed.data.totalXp
    updates.rank = getRankFromXP(parsed.data.totalXp)
  }
  if (parsed.data.role !== undefined) updates.role = parsed.data.role

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning()
  return NextResponse.json({ user: updated })
}
