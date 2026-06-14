import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { isNull, desc } from "drizzle-orm"

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUser(clerkId)
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const allUsers = await db.select().from(users).where(isNull(users.deletedAt)).orderBy(desc(users.createdAt))
  return NextResponse.json({ users: allUsers, total: allUsers.length })
}
