import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { syncUser, deleteUser } from "@/lib/missions"

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "No webhook secret" }, { status: 500 })

  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const body = await req.text()

  let event: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "user.created") {
    const d = event.data as { id: string; email_addresses: { email_address: string }[]; first_name?: string; last_name?: string; image_url?: string }
    const email = d.email_addresses[0]?.email_address ?? ""
    const name = [d.first_name, d.last_name].filter(Boolean).join(" ") || null
    await syncUser(d.id, { email, name, avatarUrl: d.image_url ?? null })
    return NextResponse.json({ received: true })
  }

  if (event.type === "user.deleted") {
    const d = event.data as { id: string }
    await deleteUser(d.id)
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true }, { status: 422 })
}
