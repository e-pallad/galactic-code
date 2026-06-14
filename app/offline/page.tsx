import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">📡</div>
      <h1 className="font-heading text-3xl font-bold text-[#e2e8f0] mb-2">Signal Lost</h1>
      <p className="text-[#94a3b8] max-w-md mb-8">
        Connection to the galactic network has been lost. Check your signal and try again.
      </p>
      <Link href="/">
        <Button>Retry Connection</Button>
      </Link>
    </div>
  )
}
