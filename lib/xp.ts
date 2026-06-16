export const XP_VALUES = {
  COMPLETE_MISSION: 15,
  COMPLETE_MISSION_FOCUS_CYCLE: 20,
  DAILY_LOGIN: 5,
  SKILL_CHECK_ATTEMPT: 5,
  SKILL_CHECK_PASS: 20,
  SKILL_CHECK_PERFECT: 35,
  COMPLETE_OPERATION: 100,
  SKIP_MISSION: 2,
  STAR_MAP_TOPIC: 10,
  STAR_MAP_SUBTOPIC: 5,
  ADD_COURSE: 10,
  COMPLETE_COURSE: 50,
  STREAK_BONUS_7: 10,
  STREAK_BONUS_30: 25,
} as const

export const RANK_THRESHOLDS: { rank: number; xpRequired: number; label: string }[] = [
  { rank: 1,  xpRequired: 0,     label: "Cadet" },
  { rank: 2,  xpRequired: 100,   label: "Navigator" },
  { rank: 3,  xpRequired: 250,   label: "Ensign" },
  { rank: 4,  xpRequired: 500,   label: "Lieutenant" },
  { rank: 5,  xpRequired: 1000,  label: "Commander" },
  { rank: 6,  xpRequired: 2000,  label: "Captain" },
  { rank: 7,  xpRequired: 3500,  label: "Fleet Captain" },
  { rank: 8,  xpRequired: 5000,  label: "Admiral" },
  { rank: 9,  xpRequired: 7500,  label: "Grand Admiral" },
  { rank: 10, xpRequired: 10000, label: "Starfleet Legend" },
]

export const CHARACTER_CLASSES: Record<string, { name: string; icon: string; flavor: string }> = {
  javascript: { name: "Code Pilot",       icon: "⚡",  flavor: "Agile navigators of the web's frontier" },
  react:      { name: "Reactor Pilot",    icon: "⚛️",  flavor: "Masters of reactive UI and component craft" },
  nodejs:     { name: "Systems Engineer", icon: "🖥️",  flavor: "Architects of the server-side galaxy" },
  nextjs:     { name: "Warp Architect",   icon: "🌐",  flavor: "Full-stack commanders bridging server and client" },
  python:     { name: "Data Mage",        icon: "🔮",  flavor: "Analysts who bend systems to their will" },
  default:    { name: "Space Cadet",      icon: "🛸",  flavor: "Exploring all sectors of the galaxy" },
}

export function getCharacterClass(track: string) {
  return CHARACTER_CLASSES[track] ?? CHARACTER_CLASSES.default
}

export function getRankFromXP(xp: number): number {
  let rank = 1
  for (const threshold of RANK_THRESHOLDS) {
    if (xp >= threshold.xpRequired) rank = threshold.rank
    else break
  }
  return rank
}

export function getRankProgress(xp: number): {
  rank: number
  label: string
  currentXp: number
  nextXp: number | null
  progress: number
} {
  const rank = getRankFromXP(xp)
  const current = RANK_THRESHOLDS.find((t) => t.rank === rank)!
  const next = RANK_THRESHOLDS.find((t) => t.rank === rank + 1)

  if (!next) {
    return { rank, label: current.label, currentXp: xp, nextXp: null, progress: 100 }
  }

  const currentXp = xp - current.xpRequired
  const nextXp = next.xpRequired - current.xpRequired
  const progress = Math.min(100, Math.floor((currentXp / nextXp) * 100))

  return { rank, label: current.label, currentXp, nextXp, progress }
}

export const MEDAL_DEFINITIONS: {
  slug: string
  label: string
  description: string
  icon: string
  xpBonus: number
  check: (stats: {
    streak: number
    rank: number
    totalXp: number
    missionsCompleted: number
    operationsCompleted: number
    skillCheckAttempts: number
    skillChecksPassed: number
    perfectChecks: number
  }) => boolean
}[] = [
  { slug: "first_mission", label: "First Mission", description: "Completed your first mission", icon: "🎯", xpBonus: 10, check: (s) => s.missionsCompleted >= 1 },
  { slug: "hyperdrive_3", label: "Hyperdrive Online", description: "3-day streak", icon: "🔥", xpBonus: 15, check: (s) => s.streak >= 3 },
  { slug: "hyperdrive_7", label: "Warp Speed", description: "7-day streak", icon: "🔥", xpBonus: 30, check: (s) => s.streak >= 7 },
  { slug: "hyperdrive_30", label: "Cosmic Velocity", description: "30-day streak", icon: "⚡", xpBonus: 100, check: (s) => s.streak >= 30 },
  { slug: "rank_5", label: "Commander Rank", description: "Reached rank 5", icon: "🏅", xpBonus: 50, check: (s) => s.rank >= 5 },
  { slug: "rank_10", label: "Starfleet Legend", description: "Reached rank 10", icon: "🌟", xpBonus: 200, check: (s) => s.rank >= 10 },
  { slug: "first_operation", label: "First Operation", description: "1 operation done", icon: "🚀", xpBonus: 50, check: (s) => s.operationsCompleted >= 1 },
  { slug: "operations_3", label: "Fleet Builder", description: "3 operations done", icon: "💼", xpBonus: 100, check: (s) => s.operationsCompleted >= 3 },
  { slug: "first_check", label: "Skill Check", description: "First attempt", icon: "📋", xpBonus: 10, check: (s) => s.skillCheckAttempts >= 1 },
  { slug: "tactical_genius", label: "Tactical Genius", description: "5 checks passed", icon: "🧠", xpBonus: 50, check: (s) => s.skillChecksPassed >= 5 },
  { slug: "perfect_score", label: "Flawless Execution", description: "100% on a check", icon: "💯", xpBonus: 25, check: (s) => s.perfectChecks >= 1 },
]
