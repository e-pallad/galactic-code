import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { verifyUnsubscribeToken } from "@/lib/email"

async function unsubscribe(req: NextRequest): Promise<boolean> {
  const userId = req.nextUrl.searchParams.get("u")
  const token = req.nextUrl.searchParams.get("t")
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) return false
  await db.update(users).set({ emailOptOut: true }).where(eq(users.id, userId))
  return true
}

// Human click from the email footer.
export async function GET(req: NextRequest) {
  const ok = await unsubscribe(req)
  if (!ok) return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 })
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Unsubscribed</title>
     <body style="background:#080C14;color:#e2e8f0;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">
       <div style="text-align:center;padding:32px">
         <h1 style="color:#06B6D4">Signal terminated.</h1>
         <p style="color:#94a3b8">You won't receive any more mission emails. You can re-enable them anytime in Settings.</p>
       </div>
     </body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

// RFC 8058 one-click unsubscribe (mail clients POST with no body semantics we need).
export async function POST(req: NextRequest) {
  const ok = await unsubscribe(req)
  if (!ok) return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 })
  return NextResponse.json({ unsubscribed: true })
}
