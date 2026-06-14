import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { starSystems, sectors, missions } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { eq } from "drizzle-orm"
import { z } from "zod"

const systemSchema = z.object({
  trackId: z.string(),
  number: z.number().int(),
  title: z.string().min(1),
  description: z.string().min(1),
  operationTitle: z.string().min(1),
  operationDescription: z.string().min(1),
})

export async function GET() {
  const systems = await db.select().from(starSystems)
  return NextResponse.json({ systems })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await getUser(clerkId)
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json() as unknown
  const parsed = systemSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [system] = await db.insert(starSystems).values(parsed.data).returning()
  return NextResponse.json({ system })
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = await getUser(clerkId)
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await db.delete(starSystems).where(eq(starSystems.id, id))
  return NextResponse.json({ success: true })
}
