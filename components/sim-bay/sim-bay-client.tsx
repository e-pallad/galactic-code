"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, ExternalLink, CheckCircle } from "lucide-react"

interface Course {
  id: string
  platform: string
  url: string
  title: string
  totalLessons: number
  completedLessons: number
  xpEarned: number
  isCompleted: boolean
  completedAt: Date | null
}

interface SimBayClientProps {
  courses: Course[]
}

export function SimBayClient({ courses: initialCourses }: SimBayClientProps) {
  const router = useRouter()
  const [courses, setCourses] = useState(initialCourses)
  const [showForm, setShowForm] = useState(false)
  const [platform, setPlatform] = useState("")
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [totalLessons, setTotalLessons] = useState("10")
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", platform, url, title, totalLessons: parseInt(totalLessons) }),
      })
      const data = await res.json() as { course: Course }
      setCourses(prev => [...prev, data.course])
      setShowForm(false)
      setPlatform(""); setUrl(""); setTitle(""); setTotalLessons("10")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleProgress = async (id: string, completedLessons: number) => {
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "progress", id, completedLessons }),
    })
    setCourses(prev => prev.map(c => c.id === id ? { ...c, completedLessons } : c))
  }

  const handleComplete = async (id: string) => {
    setLoading(true)
    try {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", id }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" /> Add External Course
      </Button>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Course</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Input id="platform" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Udemy, Coursera..." required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="total">Total Lessons</Label>
                  <Input id="total" type="number" min="1" value={totalLessons} onChange={e => setTotalLessons(e.target.value)} required className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} required className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>Add Course (+10 XP)</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 && !showForm && (
        <div className="text-center py-16 text-[#94a3b8]">
          <p className="text-4xl mb-4">🎓</p>
          <p className="font-medium text-[#e2e8f0]">No external courses tracked</p>
          <p className="text-sm mt-1">Add courses from Udemy, Coursera, or anywhere else.</p>
        </div>
      )}

      {courses.map(course => {
        const progress = Math.round((course.completedLessons / Math.max(1, course.totalLessons)) * 100)
        return (
          <Card key={course.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{course.platform}</Badge>
                    {course.isCompleted && <CheckCircle className="h-4 w-4 text-green-400" />}
                  </div>
                  <h3 className="font-medium text-[#e2e8f0] truncate">{course.title}</h3>
                </div>
                <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-[#94a3b8] hover:text-[#06B6D4]">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[#94a3b8] mb-1">
                  <span>{course.completedLessons} / {course.totalLessons} lessons</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              {!course.isCompleted && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleProgress(course.id, Math.min(course.totalLessons, course.completedLessons + 1))}>
                    +1 Lesson
                  </Button>
                  {progress >= 100 && (
                    <Button size="sm" onClick={() => handleComplete(course.id)} disabled={loading}>
                      Complete (+50 XP)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
