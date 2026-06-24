import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"

type SearchParams = {
  type?: string
  name?: string
  rank?: string
  label?: string
  xp?: string
  medal?: string
  icon?: string
  description?: string
}

type Props = {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"

  const ogUrl = new URL(`${APP_URL}/api/og`)
  Object.entries(p).forEach(([k, v]) => { if (v) ogUrl.searchParams.set(k, v) })

  const isRank = p.type !== "medal"
  const title = isRank
    ? `${p.name ?? "A cadet"} reached ${p.label ?? "a new rank"} on Galactic Code`
    : `${p.name ?? "A cadet"} earned the "${p.medal}" medal on Galactic Code`
  const desc = isRank
    ? `Rank ${p.rank} — ${p.label} — ${Number(p.xp ?? 0).toLocaleString()} XP earned. Learn to code through space missions.`
    : `${p.description ? p.description + " " : ""}Learn to code through space missions at Galactic Code Academy.`

  const sharePageUrl = `${APP_URL}/share?${new URLSearchParams(
    Object.entries(p).filter((e): e is [string, string] => Boolean(e[1]))
  )}`

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: sharePageUrl,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogUrl.toString()],
    },
  }
}

export default async function SharePage({ searchParams }: Props) {
  const p = await searchParams
  if (!p.type) redirect("/")

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"
  const isRank = p.type !== "medal"

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle,#1e2d3d_1px,transparent_1px)] bg-[length:40px_40px] opacity-40 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
        <p className="text-[#06B6D4] text-sm font-bold tracking-widest uppercase">⚡ Galactic Code</p>
        <div className="text-7xl">{isRank ? "🏅" : (p.icon ?? "🎖️")}</div>
        <div>
          <p className="text-[#94a3b8] text-sm uppercase tracking-widest mb-3">
            {isRank ? `Rank ${p.rank} achieved` : "Medal unlocked"}
          </p>
          <h1 className="text-4xl font-bold text-[#e2e8f0] font-heading mb-2">
            {isRank ? (p.label ?? "New Rank") : (p.medal ?? "New Medal")}
          </h1>
          {isRank && (
            <p className="text-[#06B6D4] text-xl font-semibold">
              {Number(p.xp ?? 0).toLocaleString()} XP
            </p>
          )}
          {!isRank && p.description && (
            <p className="text-[#94a3b8] text-sm mt-1">{p.description}</p>
          )}
          <p className="text-[#475569] text-sm mt-3">
            {p.name ?? "A cadet"} · Galactic Code Academy
          </p>
        </div>
        <Link
          href={`${APP_URL}/sign-up`}
          className="px-8 py-3 rounded-lg bg-[#06B6D4] text-[#080C14] font-bold text-lg hover:bg-[#06B6D4]/90 transition-colors"
        >
          Start your own journey →
        </Link>
        <p className="text-[#334155] text-xs">Free to start · No setup required</p>
      </div>
    </div>
  )
}
