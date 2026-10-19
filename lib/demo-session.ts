// Edge-safe (no database imports): the middleware needs it as well as the server code.
//
// Every demo visitor gets their own pilot. The `gc_demo` cookie holds a random
// 128-bit session id and the pilot's Clerk id is derived from it, so nobody can
// reach someone else's demo state without knowing that id.

export const DEMO_COOKIE = "gc_demo"
export const DEMO_CLERK_PREFIX = "demo_"
export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 2

const SESSION_ID = /^[0-9a-f]{32}$/

/** The session id from a cookie value, or null when it isn't a well-formed id (e.g. the old shared "1"). */
export function parseDemoSession(value: string | undefined | null): string | null {
  return value && SESSION_ID.test(value) ? value : null
}

export function newDemoSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "")
}

export const demoClerkId = (sessionId: string): string => `${DEMO_CLERK_PREFIX}${sessionId}`
export const isDemoClerkId = (clerkId: string): boolean => clerkId.startsWith(DEMO_CLERK_PREFIX)
