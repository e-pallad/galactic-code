import { SignIn } from "@clerk/nextjs"
import { StarField } from "@/components/layout/star-field"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#080C14] flex items-center justify-center relative">
      <StarField />
      <div className="relative z-10">
        <SignIn />
      </div>
    </div>
  )
}
