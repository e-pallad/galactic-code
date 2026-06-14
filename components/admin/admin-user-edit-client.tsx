"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/db/schema"

export function AdminUserEditClient({ user }: { user: User }) {
  const router = useRouter()
  const [xp, setXp] = useState(String(user.totalXp))
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalXp: parseInt(xp), role }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name ?? user.email}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Total XP</Label>
          <Input type="number" value={xp} onChange={e => setXp(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  )
}
