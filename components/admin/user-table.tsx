"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { User } from "@/lib/db/schema"

interface UserTableProps {
  users: User[]
  total: number
  page: number
  onPageChange: (page: number) => void
}

export function UserTable({ users, total, page, onPageChange }: UserTableProps) {
  const [search, setSearch] = useState("")
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
        <Input
          placeholder="Search pilots..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border border-[#1e2d3d] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2d3d] bg-[#0d1520]">
              <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Pilot</th>
              <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Role</th>
              <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">XP</th>
              <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Rank</th>
              <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Track</th>
              <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
              .map((user) => (
              <tr key={user.id} className="border-b border-[#1e2d3d] last:border-0 hover:bg-[#0d1520]/50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-[#e2e8f0]">{user.name ?? "—"}</p>
                    <p className="text-xs text-[#94a3b8]">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
                </td>
                <td className="px-4 py-3 text-[#06B6D4] font-medium">{user.totalXp.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#94a3b8]">{user.rank}</td>
                <td className="px-4 py-3 text-[#94a3b8]">{user.track}</td>
                <td className="px-4 py-3 text-[#94a3b8] text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94a3b8]">Showing {users.length} of {total} pilots</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
