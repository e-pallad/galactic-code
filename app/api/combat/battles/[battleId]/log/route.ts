import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { battleLog, battles } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq, asc } from "drizzle-orm"

export async function GET(req: Request, { params }: { params: Promise<{ battleId: string }> }) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { battleId } = await params
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1)
  if (!battle) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const logs = await db.select().from(battleLog).where(eq(battleLog.battleId, battleId)).orderBy(asc(battleLog.turnNumber))
  return NextResponse.json({ logs, battle })
}
