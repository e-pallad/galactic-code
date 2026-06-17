interface FleetCardProps {
  fleet: { name: string; tag: string; emblem: string; totalXp: number }
  memberCount?: number
}

export function FleetCard({ fleet, memberCount }: FleetCardProps) {
  return (
    <div className="rounded-xl border border-[#1e2d3d] bg-[#0d1520] p-4 flex items-center gap-4">
      <span className="text-3xl">{fleet.emblem}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading font-semibold text-[#e2e8f0]">{fleet.name}</p>
          <span className="text-xs px-1.5 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 font-mono">[{fleet.tag}]</span>
        </div>
        <div className="flex gap-3 text-xs text-[#94a3b8] mt-0.5">
          {memberCount !== undefined && <span>{memberCount} pilots</span>}
          <span>{fleet.totalXp.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  )
}
