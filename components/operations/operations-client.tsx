"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink, Github, Plus } from "lucide-react"
import type { StarSystem } from "@/lib/db/schema"

interface Operation {
  id: string
  trackId: string
  systemNumber: number
  title: string
  description: string
  repoUrl: string | null
  liveUrl: string | null
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  xpEarned: number
  completedAt: Date | null
}

interface OperationsClientProps {
  operations: Operation[]
  systems: StarSystem[]
  userId: string
}

export function OperationsClient({ operations: initialOps, systems }: OperationsClientProps) {
  const router = useRouter()
  const [ops, setOps] = useState(initialOps)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [repoUrl, setRepoUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreate = async (systemId: string, system: StarSystem) => {
    setLoading(true)
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          trackId: system.trackId,
          systemNumber: system.number,
          title: system.operationTitle,
          description: system.operationDescription,
        }),
      })
      const data = await res.json() as { operation: Operation }
      setOps(prev => [...prev, data.operation])
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitLinks = async (id: string) => {
    setLoading(true)
    try {
      await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, repoUrl: repoUrl || undefined, liveUrl: liveUrl || undefined }),
      })
      setEditingId(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    setLoading(true)
    try {
      await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", id }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const existingSystemNumbers = new Set(ops.map(o => o.systemNumber))

  return (
    <div className="space-y-4">
      {ops.map(op => (
        <Card key={op.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{op.title}</CardTitle>
                <p className="text-xs text-[#94a3b8] mt-1">System {op.systemNumber}</p>
              </div>
              <Badge variant={op.status === "COMPLETED" ? "success" : op.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                {op.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#94a3b8]">{op.description}</p>
            <div className="flex flex-wrap gap-2">
              {op.repoUrl && (
                <a href={op.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#06B6D4] hover:underline">
                  <Github className="h-3 w-3" /> Repo
                </a>
              )}
              {op.liveUrl && (
                <a href={op.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#06B6D4] hover:underline">
                  <ExternalLink className="h-3 w-3" /> Live
                </a>
              )}
            </div>
            {op.status !== "COMPLETED" && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingId(op.id); setRepoUrl(op.repoUrl ?? ""); setLiveUrl(op.liveUrl ?? "") }}>
                  Submit Links
                </Button>
                {op.repoUrl && (
                  <Button size="sm" onClick={() => handleComplete(op.id)} disabled={loading}>
                    Mark Complete (+100 XP)
                  </Button>
                )}
              </div>
            )}
            {op.status === "COMPLETED" && op.xpEarned > 0 && (
              <p className="text-xs text-[#06B6D4]">+{op.xpEarned} XP earned</p>
            )}
          </CardContent>
        </Card>
      ))}

      {systems.filter(s => !existingSystemNumbers.has(s.number)).map(system => (
        <Card key={system.id} className="border-dashed opacity-70 hover:opacity-100 transition-opacity">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#e2e8f0]">{system.operationTitle}</p>
                <p className="text-xs text-[#94a3b8]">System {system.number} · Not started</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleCreate(system.id, system)} disabled={loading}>
                <Plus className="h-3 w-3 mr-1" /> Start Operation
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editingId} onOpenChange={open => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Operation Links</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="repo">Repository URL</Label>
              <Input id="repo" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/..." className="mt-1" />
            </div>
            <div>
              <Label htmlFor="live">Live URL (optional)</Label>
              <Input id="live" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button onClick={() => handleSubmitLinks(editingId!)} disabled={loading || !repoUrl}>Save Links</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
