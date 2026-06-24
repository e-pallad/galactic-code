export const dynamic = "force-dynamic"

import { SignUp } from "@clerk/nextjs"
import { AuthShell, clerkAppearance } from "@/components/landing/auth-shell"

export default function SignUpPage() {
  return (
    <AuthShell title="Begin your journey" subtitle="Create your free account, launch your first mission, and start earning XP in under a minute.">
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  )
}
