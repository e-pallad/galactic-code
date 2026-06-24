import Link from "next/link"
import { StarField } from "@/components/layout/star-field"
import { Zap, ArrowLeft } from "lucide-react"

/** Clerk appearance config matching the Galactic Code dark theme. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#06B6D4",
    colorBackground: "#0d1520",
    colorText: "#e2e8f0",
    colorTextSecondary: "#94a3b8",
    colorInputBackground: "#080C14",
    colorInputText: "#e2e8f0",
    colorDanger: "#ef4444",
    colorSuccess: "#10B981",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-inter)",
  },
  elements: {
    card: "bg-[#0d1520] border border-[#1e2d3d] shadow-2xl",
    headerTitle: "font-heading",
    socialButtonsBlockButton: "border-[#1e2d3d]",
    formButtonPrimary: "bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-[#080C14] font-semibold",
    footerActionLink: "text-[#06B6D4] hover:text-[#06B6D4]/80",
  },
} as const

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#080C14] relative flex flex-col">
      <StarField />
      <header className="relative z-10 px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#e2e8f0] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back home</span>
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-6 w-6 text-[#06B6D4]" />
          <span className="font-heading font-bold text-[#06B6D4] tracking-wide text-lg">GALACTIC CODE</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0] mb-1 text-center">{title}</h1>
        <p className="text-sm text-[#94a3b8] mb-8 text-center max-w-sm">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
