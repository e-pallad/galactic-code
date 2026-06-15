export const dynamic = "force-dynamic"

import { SignUp } from "@clerk/nextjs"
import { StarField } from "@/components/layout/star-field"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#080C14] flex items-center justify-center relative">
      <StarField />
      <div className="relative z-10">
        <SignUp />
      </div>
    </div>
  )
}
