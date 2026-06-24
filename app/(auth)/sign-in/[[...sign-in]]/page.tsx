export const dynamic = "force-dynamic"

import { SignIn } from "@clerk/nextjs"
import { AuthShell, clerkAppearance } from "@/components/landing/auth-shell"

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back, pilot" subtitle="Sign in to resume your missions and continue your journey across the galaxy.">
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  )
}
