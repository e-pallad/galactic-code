import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { GoalsForm } from "@/components/settings/goals-form"

export const metadata = { title: "Goals" }

export default async function GoalsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Mission Quotas</h1>
      <GoalsForm user={user} />
    </div>
  )
}
