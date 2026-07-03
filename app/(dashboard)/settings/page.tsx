export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { tracks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const activeTracks = await db
    .select({ id: tracks.id, name: tracks.name, icon: tracks.icon, characterClass: tracks.characterClass })
    .from(tracks)
    .where(eq(tracks.isActive, true))

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Settings</h1>
      <SettingsForm user={user} tracks={activeTracks} />
    </div>
  )
}
