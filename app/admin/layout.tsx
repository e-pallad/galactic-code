export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { getUser } from "@/lib/missions"
import Link from "next/link"
import { Shield, Users, BookOpen, BarChart2 } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) notFound()

  const user = await getUser(clerkId)
  if (!user || user.role !== "admin") notFound()

  return (
    <div className="min-h-screen bg-[#080C14] flex">
      <aside className="w-56 border-r border-[#1e2d3d] bg-[#080C14] flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e2d3d]">
          <Shield className="h-5 w-5 text-red-400" />
          <span className="font-heading font-bold text-red-400 text-sm">ADMIN</span>
        </div>
        <nav className="flex-1 py-3">
          {[
            { href: "/admin", label: "Overview", icon: BarChart2 },
            { href: "/admin/users", label: "Users", icon: Users },
            { href: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#0d1520] transition-colors">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-5 py-3 border-t border-[#1e2d3d]">
          <Link href="/dashboard" className="text-xs text-[#94a3b8] hover:text-[#e2e8f0]">← Back to App</Link>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
