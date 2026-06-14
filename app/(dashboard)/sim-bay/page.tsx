"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, Plus } from "lucide-react"

interface Course {
  id: string
  title: string
  platform: string
  url: string
  totalLessons: number
  completedLessons: number
  isCompleted: boolean
  xpEarned: number
}

export default function SimBayPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: "", platform: "", url: "", totalLessons: 10 })

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(d => setCourses(d.courses ?? []))
  }, [])

  const handleAdd = async () => {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", ...form }),
    })
    if (res.ok) {
      const data = await res.json()
      setCourses(c => [...c, data.course])
      setAdding(false)
      setForm({ title: "", platform: "", url: "", totalLessons: 10 })
    }
  }

  const handleProgress = async (id: string, completedLessons: number) => {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "progress", id, completedLessons }),
    })
    if (res.ok) {
      setCourses(c => c.map(course => course.id === id ? { ...course, completedLessons } : course))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Simulation Bay</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Track external courses alongside your missions.</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="h-4 w-4 mr-1" /> Add Course
        </Button>
      </div>

      {adding && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Add External Course</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1">Course Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="JavaScript: The Complete Guide" /></div>
              <div><Label className="text-xs mb-1">Platform</Label><Input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="Udemy, Coursera, freeCodeCamp…" /></div>
              <div><Label className="text-xs mb-1">URL</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
              <div><Label className="text-xs mb-1">Total Lessons</Label><Input type="number" min={1} value={form.totalLessons} onChange={e => setForm(f => ({ ...f, totalLessons: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!form.title || !form.platform}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 && !adding ? (
        <div className="text-center py-20 text-[#94a3b8]">
          <Monitor className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="font-heading text-lg text-[#e2e8f0]">No courses tracked yet.</p>
          <p className="text-sm mt-2">Add an external course to earn XP for progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <Card key={course.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-[#e2e8f0]">{course.title}</p>
                    <p className="text-xs text-[#94a3b8]">{course.platform}</p>
                  </div>
                  <Badge variant={course.isCompleted ? "success" : "outline"}>
                    {course.isCompleted ? "Complete" : `${course.completedLessons}/${course.totalLessons}`}
                  </Badge>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1e2d3d] mb-3">
                  <div
                    className="h-1.5 rounded-full bg-[#06B6D4] transition-all"
                    style={{ width: `${Math.min(100, (course.completedLessons / course.totalLessons) * 100)}%` }}
                  />
                </div>
                {!course.isCompleted && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={course.totalLessons}
                      defaultValue={course.completedLessons}
                      className="w-20 h-7 text-xs"
                      onBlur={e => handleProgress(course.id, parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs text-[#94a3b8]">of {course.totalLessons} lessons</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
