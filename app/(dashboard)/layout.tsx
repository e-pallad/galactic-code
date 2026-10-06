import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { TopBar } from "@/components/layout/top-bar"
import { StarField } from "@/components/layout/star-field"
import { RouteGuard } from "@/components/layout/route-guard"
import { UnlockWatcher } from "@/components/layout/unlock-watcher"
import { DailyCheckIn } from "@/components/layout/daily-check-in"
import { DemoBanner } from "@/components/demo/demo-banner"
import { ReferralClaim } from "@/components/gamification/referral-claim"
import { getClerkId, isDemo } from "@/lib/auth"
import { getUser } from "@/lib/missions"
import { getAccess } from "@/lib/unlocks"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [clerkId, demo] = await Promise.all([getClerkId(), isDemo()])
  const user = clerkId ? await getUser(clerkId) : null
  const access = getAccess(user, demo)

  return (
    <div className="flex min-h-screen bg-[#080C14]">
      <StarField />
      <Sidebar access={access} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} demo={demo} access={access} />
        <DemoBanner />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 relative z-10">
          <RouteGuard access={access} xp={user?.totalXp ?? 0}>
            {children}
          </RouteGuard>
        </main>
      </div>
      <MobileNav access={access} />
      <ReferralClaim />
      {user && <UnlockWatcher userId={user.id} access={access} />}
      {user && !demo && <DailyCheckIn userId={user.id} />}
    </div>
  )
}
