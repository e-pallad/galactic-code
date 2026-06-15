export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { AdminUserEditClient } from "@/components/admin/admin-user-edit-client"

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) notFound()

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Edit Pilot</h1>
      <AdminUserEditClient user={user} />
    </div>
  )
}
