import Image from "next/image"
import { RankBadge } from "@/components/gamification/rank-badge"
import { XPBar } from "@/components/gamification/xp-bar"
import { HyperdriveCounter } from "@/components/gamification/hyperdrive-counter"
import { getCharacterClass } from "@/lib/xp"
import type { User } from "@/lib/db/schema"
import { Shield, Zap } from "lucide-react"

interface PilotSheetProps {
  user: User
}

export function PilotSheet({ user }: PilotSheetProps) {
  const charClass = getCharacterClass(user.track)

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-xl border border-[#1e2d3d] bg-[#0d1520]">
      <div className="flex flex-col items-center gap-4 md:w-48">
        {user.avatarUrl ? (
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#06B6D4]">
            <Image src={user.avatarUrl} alt={user.name ?? "Pilot"} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#6366F1] flex items-center justify-center text-3xl font-bold text-white">
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
        )}
        <div className="text-center">
          <h2 className="font-heading font-bold text-lg text-[#e2e8f0]">{user.name ?? "Unnamed Pilot"}</h2>
          <p className="text-sm text-[#94a3b8]">{user.email}</p>
        </div>
        <HyperdriveCounter streak={user.streak} />
      </div>

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-[#080C14] border border-[#1e2d3d]">
            <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
              <Shield className="h-3 w-3" />
              Character Class
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{charClass.icon}</span>
              <div>
                <p className="font-medium text-[#e2e8f0] text-sm">{charClass.name}</p>
                <p className="text-xs text-[#94a3b8]">{user.track}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#080C14] border border-[#1e2d3d]">
            <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1">
              <Zap className="h-3 w-3" />
              Total XP
            </div>
            <p className="text-xl font-bold text-[#06B6D4]">{user.totalXp.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <RankBadge xp={user.totalXp} className="mb-2" />
          <XPBar xp={user.totalXp} />
        </div>

        <div className="text-sm text-[#94a3b8]">
          <p className="italic">&quot;{charClass.flavor}&quot;</p>
        </div>
      </div>
    </div>
  )
}
