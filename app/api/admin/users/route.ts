import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { desc, isNull, like, or } from "drizzle-orm"

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().optional(),
})

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await getUser(clerkId)
  if (!admin || admin.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const { page, search } = querySchema.parse(Object.fromEntries(searchParams))
  const limit = 50
  const offset = (page - 1) * limit

  const conditions = [isNull(users.deletedAt)]
  if (search) conditions.push(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))!)

  const results = await db
    .select()
    .from(users)
    .where(conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => a && b as never))
    .orderBy(desc(users.totalXp))
    .limit(limit)
    .offset(offset)

  return Response.json({ users: results, page })
}
