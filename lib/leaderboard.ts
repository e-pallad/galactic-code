import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc, asc, and, isNull } from "drizzle-orm"
import type { PilotRow } from "@/components/leaderboard/pilot-list"

export const LEADERBOARD_PAGE_SIZE = 50

export async function getLeaderboardPage(page: number): Promise<{ pilots: PilotRow[]; hasNext: boolean }> {
  const offset = (page - 1) * LEADERBOARD_PAGE_SIZE

  // Fetch one extra row to know whether a next page exists without a count query.
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: users.totalXp,
      rank: users.rank,
      streak: users.streak,
      track: users.track,
    })
    .from(users)
    .where(and(eq(users.showOnLeaderboard, true), isNull(users.deletedAt)))
    // Tie-break equal XP by signup order so identical scores have a stable rank.
    .orderBy(desc(users.totalXp), asc(users.createdAt))
    .limit(LEADERBOARD_PAGE_SIZE + 1)
    .offset(offset)

  return { pilots: rows.slice(0, LEADERBOARD_PAGE_SIZE), hasNext: rows.length > LEADERBOARD_PAGE_SIZE }
}
