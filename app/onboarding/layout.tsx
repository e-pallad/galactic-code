import { redirect } from "next/navigation"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (!(await isDemo())) {
    const clerkId = await getClerkId()
    const user = clerkId ? await getUser(clerkId) : null
    if (user?.onboardingCompleted) redirect("/api/user/onboarding/sync")
  }
  return children
}
