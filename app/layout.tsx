import type { Metadata } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import { SwRegister } from "@/components/sw-register"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "Galactic Code", template: "%s | Galactic Code" },
  description: "Master programming through epic space missions, earn XP, rank up, and explore the universe of code.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} dark`} suppressHydrationWarning>
        <body className="min-h-screen bg-[#080C14] text-[#e2e8f0] antialiased">
          {children}
          <Toaster />
          <Analytics />
          <SwRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
