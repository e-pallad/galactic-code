"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewSystemPage() {
  const router = useRouter()
  const [form, setForm] = useState({ trackId: "javascript", number: "1", title: "", description: "", operationTitle: "", operationDescription: "" })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/admin/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, number: parseInt(form.number) }),
      })
      router.push("/admin/curriculum")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0] mb-6">New Star System</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Track ID</Label>
                <Input value={form.trackId} onChange={e => setForm(f => ({ ...f, trackId: e.target.value }))} required className="mt-1" />
              </div>
              <div>
                <Label>System Number</Label>
                <Input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3} className="mt-1 flex w-full rounded-md border border-[#1e2d3d] bg-[#0d1520] px-3 py-2 text-sm text-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]" />
            </div>
            <div>
              <Label>Operation Title</Label>
              <Input value={form.operationTitle} onChange={e => setForm(f => ({ ...f, operationTitle: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <Label>Operation Description</Label>
              <textarea value={form.operationDescription} onChange={e => setForm(f => ({ ...f, operationDescription: e.target.value }))} required rows={2} className="mt-1 flex w-full rounded-md border border-[#1e2d3d] bg-[#0d1520] px-3 py-2 text-sm text-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create System"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
