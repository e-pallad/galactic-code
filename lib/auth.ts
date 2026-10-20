import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { DEMO_COOKIE, demoClerkId, parseDemoSession } from "@/lib/demo-session"

async function demoSession(): Promise<string | null> {
  const jar = await cookies()
  return parseDemoSession(jar.get(DEMO_COOKIE)?.value)
}

export async function getClerkId(): Promise<string | null> {
  const session = await demoSession()
  if (session) return demoClerkId(session)
  const { userId } = await auth()
  return userId
}

export async function isDemo(): Promise<boolean> {
  return (await demoSession()) !== null
}
