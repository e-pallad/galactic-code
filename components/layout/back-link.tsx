import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/** Labeled, keyboard-accessible back link used across detail pages. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors rounded-md px-1 -ml-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
