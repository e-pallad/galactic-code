"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function NewSystemPage() {
  const router = useRouter()
  const [form, setForm] = useState({ trackId: "javascript", number: 1, title: "", description: "", operationTitle: "", operationDescription: "" })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch("/api/admin/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_system", ...form }),
    })
    setSaving(false)
    if (res.ok) router.push("/admin/curriculum")
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Link href="/admin/curriculum" className="flex items-center gap-1 text-sm text-[#94a3b8] hover:text-[#e2e8f0]">
        <ChevronLeft className="h-4 w-4" /> Curriculum
      </Link>
      <h1 className="font-heading text-xl font-bold text-[#e2e8f0]">New Star System</h1>
      <div className="space-y-4">
        {[
          { key: "title", label: "System Title", placeholder: "JavaScript Foundations" },
          { key: "description", label: "Description", placeholder: "Master the building blocks of JavaScript." },
          { key: "operationTitle", label: "Capstone Operation Title", placeholder: "Build a To-Do App" },
          { key: "operationDescription", label: "Capstone Operation Description", placeholder: "Create a full-featured to-do app using vanilla JS." },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <Label className="text-xs mb-1">{label}</Label>
            <Input placeholder={placeholder} value={(form as Record<string, string | number>)[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1">Track</Label>
            <select
              value={form.trackId}
              onChange={e => setForm(f => ({ ...f, trackId: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-[#1e2d3d] bg-[#0d1520] px-3 text-sm text-[#e2e8f0]"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1">System Number</Label>
            <Input type="number" min={1} value={form.number} onChange={e => setForm(f => ({ ...f, number: parseInt(e.target.value) || 1 }))} />
          </div>
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={saving || !form.title}>{saving ? "Creating…" : "Create System"}</Button>
    </div>
  )
}
