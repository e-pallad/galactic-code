"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, ExternalLink } from "lucide-react"

interface Operation {
  id: string
  title: string
  description: string
  status: string
  repoUrl?: string
  liveUrl?: string
  xpEarned: number
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/operations")
      .then(r => r.json())
      .then(data => setOperations(data.operations ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (id: string, field: "repoUrl" | "liveUrl", value: string) => {
    await fetch("/api/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, [field]: value }),
    })
  }

  const handleComplete = async (id: string) => {
    const res = await fetch("/api/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", id }),
    })
    if (res.ok) {
      setOperations(ops => ops.map(o => o.id === id ? { ...o, status: "COMPLETED", xpEarned: 100 } : o))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Operations</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Capstone projects — real code, real XP.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-[#0d1520] border border-[#1e2d3d] animate-pulse" />)}
        </div>
      ) : operations.length === 0 ? (
        <div className="text-center py-20 text-[#94a3b8]">
          <Rocket className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="font-heading text-lg text-[#e2e8f0]">No operations yet.</p>
          <p className="text-sm mt-2">Complete star systems to unlock capstone operations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {operations.map(op => (
            <Card key={op.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{op.title}</CardTitle>
                  <Badge variant={op.status === "COMPLETED" ? "success" : op.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                    {op.status === "COMPLETED" ? "Complete" : op.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[#94a3b8]">{op.description}</p>
                {op.status !== "COMPLETED" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1">Repo URL</Label>
                      <Input
                        placeholder="https://github.com/..."
                        defaultValue={op.repoUrl ?? ""}
                        onBlur={e => handleUpdate(op.id, "repoUrl", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1">Live URL</Label>
                      <Input
                        placeholder="https://..."
                        defaultValue={op.liveUrl ?? ""}
                        onBlur={e => handleUpdate(op.id, "liveUrl", e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {op.status === "COMPLETED" && op.repoUrl && (
                  <a href={op.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#06B6D4] hover:underline">
                    View Repo <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">{op.xpEarned > 0 ? `+${op.xpEarned} XP earned` : "100 XP on completion"}</span>
                  {op.status !== "COMPLETED" && (
                    <Button size="sm" onClick={() => handleComplete(op.id)}>Mark Complete</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
