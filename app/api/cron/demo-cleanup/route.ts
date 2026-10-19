import { NextRequest } from "next/server"
import { isCronAuthorized } from "@/lib/cron"
import { deleteExpiredDemoUsers } from "@/lib/demo"

export const dynamic = "force-dynamic"

// Every demo visit creates a pilot; this removes the ones untouched for a day.
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const deleted = await deleteExpiredDemoUsers(new Date(Date.now() - 24 * 60 * 60 * 1000))
  return Response.json({ deleted })
}
