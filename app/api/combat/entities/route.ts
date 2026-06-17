import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { entities } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"

export async function GET() {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const allEntities = await db.select().from(entities)
  return NextResponse.json({ entities: allEntities })
}
