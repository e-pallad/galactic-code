import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { starSystems, sectors, missions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUser } from "@/lib/missions"

const createSystemSchema = z.object({
  action: z.literal("create_system"),
  trackId: z.string().min(1),
  number: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  operationTitle: z.string().min(1),
  operationDescription: z.string().min(1),
})

const createSectorSchema = z.object({
  action: z.literal("create_sector"),
  systemId: z.string().uuid(),
  number: z.number().int().min(1),
  theme: z.string().min(1),
})

const createMissionSchema = z.object({
  action: z.literal("create_mission"),
  sectorId: z.string().uuid(),
  systemId: z.string().uuid(),
  number: z.number().int().min(1),
  title: z.string().min(1),
  type: z.enum(["briefing", "training-op", "strike-mission", "debrief"]),
  durationMinutes: z.number().int().min(1),
  description: z.string().min(1),
  practicalExample: z.string().optional(),
})

const publishSchema = z.object({
  action: z.literal("publish"),
  type: z.enum(["system", "mission"]),
  id: z.string().uuid(),
  publish: z.boolean(),
})

const deleteSchema = z.object({
  action: z.literal("delete"),
  type: z.enum(["system", "sector", "mission"]),
  id: z.string().uuid(),
})

async function requireAdmin(clerkId: string) {
  const user = await getUser(clerkId)
  return user?.role === "admin" ? user : null
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await requireAdmin(clerkId)
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const systemId = searchParams.get("systemId")

  if (systemId) {
    const [systemSectors, systemMissions] = await Promise.all([
      db.select().from(sectors).where(eq(sectors.systemId, systemId)),
      db.select().from(missions).where(eq(missions.systemId, systemId)),
    ])
    return Response.json({ sectors: systemSectors, missions: systemMissions })
  }

  const allSystems = await db.select().from(starSystems)
  return Response.json({ systems: allSystems })
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const admin = await requireAdmin(clerkId)
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  if (body.action === "create_system") {
    const result = createSystemSchema.safeParse(body)
    if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })
    const [system] = await db.insert(starSystems).values(result.data).returning()
    return Response.json({ system })
  }

  if (body.action === "create_sector") {
    const result = createSectorSchema.safeParse(body)
    if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })
    const [sector] = await db.insert(sectors).values(result.data).returning()
    return Response.json({ sector })
  }

  if (body.action === "create_mission") {
    const result = createMissionSchema.safeParse(body)
    if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })
    const [mission] = await db.insert(missions).values(result.data).returning()
    return Response.json({ mission })
  }

  if (body.action === "publish") {
    const result = publishSchema.safeParse(body)
    if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })
    const publishedAt = result.data.publish ? new Date() : null
    if (result.data.type === "system") {
      await db.update(starSystems).set({ publishedAt }).where(eq(starSystems.id, result.data.id))
    } else {
      await db.update(missions).set({ publishedAt }).where(eq(missions.id, result.data.id))
    }
    return Response.json({ success: true })
  }

  if (body.action === "delete") {
    const result = deleteSchema.safeParse(body)
    if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })
    if (result.data.type === "system") await db.delete(starSystems).where(eq(starSystems.id, result.data.id))
    else if (result.data.type === "sector") await db.delete(sectors).where(eq(sectors.id, result.data.id))
    else await db.delete(missions).where(eq(missions.id, result.data.id))
    return Response.json({ success: true })
  }

  return Response.json({ error: "Unknown action" }, { status: 422 })
}
