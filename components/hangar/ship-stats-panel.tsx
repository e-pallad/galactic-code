interface StatRowProps {
  label: string
  base: number
  effective: number
  icon: string
}

function StatRow({ label, base, effective, icon }: StatRowProps) {
  const bonus = effective - base
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e2d3d] last:border-0">
      <span className="text-[#94a3b8] text-sm flex items-center gap-2">
        <span>{icon}</span>{label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[#94a3b8] text-sm font-mono">{base}</span>
        {bonus > 0 && <span className="text-xs text-[#10b981] font-mono">+{bonus}</span>}
        <span className="text-[#e2e8f0] font-bold font-mono w-8 text-right">{effective}</span>
      </div>
    </div>
  )
}

interface ShipStatsPanelProps {
  ship: { baseHp: number; baseAtk: number; baseDef: number; baseSpd: number }
  effectiveStats: { hp: number; atk: number; def: number; spd: number }
}

export function ShipStatsPanel({ ship, effectiveStats }: ShipStatsPanelProps) {
  return (
    <div className="rounded-xl border border-[#1e2d3d] bg-[#0d1520] p-4">
      <h3 className="text-sm font-medium text-[#94a3b8] mb-3">Ship Stats</h3>
      <StatRow label="HP" base={ship.baseHp} effective={effectiveStats.hp} icon="❤️" />
      <StatRow label="ATK" base={ship.baseAtk} effective={effectiveStats.atk} icon="⚔️" />
      <StatRow label="DEF" base={ship.baseDef} effective={effectiveStats.def} icon="🛡️" />
      <StatRow label="SPD" base={ship.baseSpd} effective={effectiveStats.spd} icon="⚡" />
    </div>
  )
}
