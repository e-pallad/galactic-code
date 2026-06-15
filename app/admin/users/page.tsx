export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { isNull, desc } from "drizzle-orm"
import { UserTableClient } from "@/components/admin/user-table-client"

export const metadata = { title: "Admin — Users" }

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users).where(isNull(users.deletedAt)).orderBy(desc(users.createdAt)).limit(100)

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Pilot Registry</h1>
      <UserTableClient users={allUsers} total={allUsers.length} />
    </div>
  )
}
