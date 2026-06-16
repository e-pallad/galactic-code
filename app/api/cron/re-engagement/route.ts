import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isNull, eq, and } from "drizzle-orm"
import { sendReEngagementEmail } from "@/lib/email"
import { subDays, startOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const twoDaysAgo = startOfDay(subDays(new Date(), 2))
  const threeDaysAgo = startOfDay(subDays(new Date(), 3))

  const inactive = await db
    .select()
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.emailOptOut, false)))

  const targets = inactive.filter(u => {
    if (!u.lastSeenAt) return false
    const last = startOfDay(new Date(u.lastSeenAt))
    return last >= threeDaysAgo && last < twoDaysAgo
  })

  let sent = 0
  for (const user of targets) {
    try {
      await sendReEngagementEmail(user.email, user.name, user.streak)
      sent++
    } catch {
      // continue to next user
    }
  }

  return Response.json({ sent, total: targets.length })
}
