import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { randomUUID } from "crypto"

function genCode(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
}

export async function GET() {
  if (await isDemo()) return NextResponse.json({ referralCode: null, referralCount: 0, referralUrl: null })

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!user.referralCode) {
    const [updated] = await db
      .update(users)
      .set({ referralCode: genCode() })
      .where(eq(users.id, user.id))
      .returning()
    user = updated
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"
  return NextResponse.json({
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    referralUrl: `${APP_URL}/r/${user.referralCode}`,
  })
}
