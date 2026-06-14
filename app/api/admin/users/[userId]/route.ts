import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUser } from "@/lib/missions"

const bodySchema = z.object({
  totalXp: z.number().int().min(0).optional(),
  role: z.enum(["user", "admin", "moderator"]).optional(),
  deletedAt: z.literal(null).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId: targetId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await getUser(clerkId)
  if (!admin || admin.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const result = bodySchema.safeParse(body)
  if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })

  const updates: Record<string, unknown> = {}
  if (result.data.totalXp !== undefined) updates.totalXp = result.data.totalXp
  if (result.data.role !== undefined) updates.role = result.data.role
  if ("deletedAt" in result.data) updates.deletedAt = null

  if (Object.keys(updates).length === 0) return Response.json({ success: true })

  await db.update(users).set(updates).where(eq(users.id, targetId))
  return Response.json({ success: true })
}
