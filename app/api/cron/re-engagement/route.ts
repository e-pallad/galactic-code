import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isNull, eq, and, gte, lt } from "drizzle-orm"
import { sendReEngagementEmail } from "@/lib/email"
import { isCronAuthorized, sendInBatches } from "@/lib/cron"
import { subDays, startOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Pilots whose last visit was the day before yesterday.
  const twoDaysAgo = startOfDay(subDays(new Date(), 2))
  const threeDaysAgo = startOfDay(subDays(new Date(), 3))

  const targets = await db
    .select()
    .from(users)
    .where(and(
      isNull(users.deletedAt),
      eq(users.emailOptOut, false),
      gte(users.lastSeenAt, threeDaysAgo),
      lt(users.lastSeenAt, twoDaysAgo),
    ))

  const { sent, failed } = await sendInBatches(targets, (u) => sendReEngagementEmail(u.id, u.email, u.name, u.streak))

  return Response.json({ sent, failed, total: targets.length })
}
