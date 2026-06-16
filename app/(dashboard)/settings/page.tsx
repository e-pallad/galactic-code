export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Settings</h1>
      <SettingsForm user={user} />
    </div>
  )
}
