import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { getUser } from "@/lib/missions"
import Link from "next/link"
import { Shield } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) notFound()
  const user = await getUser(clerkId)
  if (!user || user.role !== "admin") notFound()

  return (
    <div className="min-h-screen bg-[#080C14]">
      <header className="border-b border-[#1e2d3d] px-6 py-3 flex items-center gap-3">
        <Shield className="h-4 w-4 text-[#8B5CF6]" />
        <span className="font-heading font-bold text-[#8B5CF6] text-sm">ADMIN PANEL</span>
        <nav className="flex items-center gap-4 ml-6 text-sm">
          {[["Overview", "/admin"], ["Users", "/admin/users"], ["Curriculum", "/admin/curriculum"]].map(([label, href]) => (
            <Link key={href} href={href} className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">{label}</Link>
          ))}
        </nav>
        <Link href="/dashboard" className="ml-auto text-xs text-[#94a3b8] hover:text-[#e2e8f0]">← Back to app</Link>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
