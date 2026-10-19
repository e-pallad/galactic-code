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

const PAGE_STYLE = `background:#080C14;color:#e2e8f0;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0`

function html(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Mission emails</title>
     <body style="${PAGE_STYLE}"><div style="text-align:center;padding:32px">${body}</div></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

// The footer link only shows a confirmation step: mail scanners and link
// prefetchers open links with GET, and that must not opt anybody out.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("u")
  const token = req.nextUrl.searchParams.get("t")
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return html(`<h1 style="color:#ef4444">Invalid link</h1><p style="color:#94a3b8">This unsubscribe link is not valid.</p>`, 400)
  }
  return html(`
    <h1 style="color:#06B6D4">Stop mission emails?</h1>
    <p style="color:#94a3b8">You can re-enable them anytime in Settings.</p>
    <form method="POST" action="${req.nextUrl.pathname}?${req.nextUrl.searchParams.toString().replace(/&/g, "&amp;")}">
      <button type="submit" style="margin-top:16px;padding:12px 24px;border:0;border-radius:8px;background:#06B6D4;color:#080C14;font-weight:700;cursor:pointer">Unsubscribe</button>
    </form>`)
}

// RFC 8058 one-click (mail clients POST) and the confirmation button above (a
// browser form post, which asks for HTML).
export async function POST(req: NextRequest) {
  const ok = await unsubscribe(req)
  const wantsHtml = req.headers.get("accept")?.includes("text/html") ?? false
  if (!ok) {
    return wantsHtml
      ? html(`<h1 style="color:#ef4444">Invalid link</h1>`, 400)
      : NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 })
  }
  return wantsHtml
    ? html(`<h1 style="color:#06B6D4">Signal terminated.</h1><p style="color:#94a3b8">You won't receive any more mission emails. You can re-enable them anytime in Settings.</p>`)
    : NextResponse.json({ unsubscribed: true })
}
