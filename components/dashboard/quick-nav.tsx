import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickNavProps {
  lastMission?: { id: string; title: string; systemId: string } | null
  currentSystem?: { id: string; title: string; number: number } | null
}

export function QuickNav({ lastMission, currentSystem }: QuickNavProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {currentSystem && (
        <Link href={`/academy/${currentSystem.id}`}>
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
            <BookOpen className="h-4 w-4" />
            System {currentSystem.number}: {currentSystem.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
      {lastMission && (
        <Link href={`/academy/${lastMission.systemId}`}>
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            Continue: {lastMission.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}
