import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) notFound()

  return (
    <div className="space-y-6 max-w-lg">
      <Link href="/admin/users" className="flex items-center gap-1 text-sm text-[#94a3b8] hover:text-[#e2e8f0]">
        <ChevronLeft className="h-4 w-4" /> Users
      </Link>
      <h1 className="font-heading text-xl font-bold text-[#e2e8f0]">{user.name ?? user.email}</h1>
      <div className="space-y-2 text-sm">
        {[["Email", user.email], ["Role", user.role], ["Total XP", String(user.totalXp)], ["Rank", String(user.rank)], ["Streak", String(user.streak)], ["Track", user.track]].map(([k, v]) => (
          <div key={k} className="flex justify-between p-3 rounded-lg bg-[#0d1520] border border-[#1e2d3d]">
            <span className="text-[#94a3b8]">{k}</span>
            <span className="text-[#e2e8f0] font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
