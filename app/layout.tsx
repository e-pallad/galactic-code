import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const OG_DESCRIPTION =
  "Master programming through epic space missions. Earn XP, rank up your pilot, battle Void Entities, and explore the universe of code — all while actually learning to code."

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "Galactic Code", template: "%s | Galactic Code" },
  description: OG_DESCRIPTION,
  applicationName: "Galactic Code",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Galactic Code",
  },
  keywords: [
    "learn programming",
    "coding game",
    "gamified learning",
    "space RPG learning",
    "JavaScript missions",
    "TypeScript learning",
    "coding platform",
    "learn to code",
    "XP coding",
    "developer game",
  ],
  authors: [{ name: "Galactic Code", url: APP_URL }],
  creator: "Galactic Code",
  openGraph: {
    type: "website",
    siteName: "Galactic Code",
    title: "Galactic Code — Space-Themed RPG Learning Platform",
    description: OG_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Galactic Code — Space-Themed RPG Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Galactic Code — Space-Themed RPG Learning Platform",
    description: OG_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#6366f1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} dark`} suppressHydrationWarning>
        <body className="min-h-screen bg-[#080C14] text-[#e2e8f0] antialiased">
          {children}
          <Toaster />
          <Analytics />
          <SpeedInsights />
          <SwRegister />
        </body>
      </html>
    </ClerkProvider>
  )
}
