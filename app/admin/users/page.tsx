import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { desc, isNull } from "drizzle-orm"
import { UserTable } from "@/components/admin/user-table"

export const metadata = { title: "Admin — Users" }

export default async function AdminUsersPage() {
  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.totalXp))
    .limit(100)

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Users</h1>
      <UserTable users={allUsers} />
    </div>
  )
}
