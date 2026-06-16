import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { DEMO_CLERK_ID } from "@/lib/demo"

export async function getClerkId(): Promise<string | null> {
  const jar = await cookies()
  if (jar.get("gc_demo")?.value === "1") return DEMO_CLERK_ID
  const { userId } = await auth()
  return userId
}

export async function isDemo(): Promise<boolean> {
  const jar = await cookies()
  return jar.get("gc_demo")?.value === "1"
}
