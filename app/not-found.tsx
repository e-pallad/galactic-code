import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🌌</div>
      <h1 className="font-heading text-4xl font-bold text-[#e2e8f0] mb-2">404</h1>
      <p className="text-xl text-[#06B6D4] font-medium mb-4">Sector Not Found</p>
      <p className="text-[#94a3b8] max-w-md mb-8">
        You&apos;ve drifted into uncharted space. This sector doesn&apos;t exist in our star charts.
      </p>
      <Link href="/dashboard">
        <Button>Return to Command Bridge</Button>
      </Link>
    </div>
  )
}
