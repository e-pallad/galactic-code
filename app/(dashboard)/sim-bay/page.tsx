export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { db } from "@/lib/db"
import { externalCourses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SimBayClient } from "@/components/sim-bay/sim-bay-client"

export const metadata = { title: "Sim Bay" }

export default async function SimBayPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const courses = await db.select().from(externalCourses).where(eq(externalCourses.userId, user.id))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Sim Bay</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Track external courses and simulations alongside your missions</p>
      </div>
      <SimBayClient courses={courses} />
    </div>
  )
}
