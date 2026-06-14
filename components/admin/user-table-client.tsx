"use client"

import { useState } from "react"
import { UserTable } from "@/components/admin/user-table"
import type { User } from "@/lib/db/schema"

interface UserTableClientProps {
  users: User[]
  total: number
}

export function UserTableClient({ users, total }: UserTableClientProps) {
  const [page, setPage] = useState(1)
  return <UserTable users={users} total={total} page={page} onPageChange={setPage} />
}
