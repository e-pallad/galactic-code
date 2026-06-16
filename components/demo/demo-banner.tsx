import { cookies } from "next/headers"
import Link from "next/link"
import { Rocket } from "lucide-react"

export async function DemoBanner() {
  const jar = await cookies()
  if (jar.get("gc_demo")?.value !== "1") return null

  return (
    <div className="sticky top-14 z-30 flex items-center justify-between gap-3 px-4 py-2 bg-[#06B6D4]/15 border-b border-[#06B6D4]/30 text-sm">
      <div className="flex items-center gap-2 text-[#06B6D4]">
        <Rocket className="h-4 w-4 shrink-0" />
        <span className="text-[#e2e8f0]">
          Demo mode — progress resets each session.
        </span>
      </div>
      <Link
        href="/sign-up"
        className="shrink-0 px-3 py-1 rounded bg-[#06B6D4] text-[#080C14] font-medium hover:bg-[#06B6D4]/90 transition-colors"
      >
        Sign up free
      </Link>
    </div>
  )
}
