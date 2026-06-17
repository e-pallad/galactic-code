import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  uuid,
  jsonb,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "moderator"])
export const missionTypeEnum = pgEnum("mission_type", [
  "briefing",
  "training-op",
  "strike-mission",
  "debrief",
])
export const missionStatusEnum = pgEnum("mission_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
])
export const operationStatusEnum = pgEnum("operation_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
])
export const nodeTypeEnum = pgEnum("node_type", ["topic", "subtopic"])
export const nodeStatusEnum = pgEnum("node_status", ["NOT_STARTED", "COMPLETED"])

export const itemRarityEnum = pgEnum("item_rarity", ["common", "uncommon", "rare", "epic", "legendary"])
export const itemTypeEnum = pgEnum("item_type", ["weapon", "shield", "engine", "skin"])
export const entityRarityEnum = pgEnum("entity_rarity", ["common", "uncommon", "rare", "boss"])
export const battleStatusEnum = pgEnum("battle_status", ["active", "victory", "defeat", "fled"])
export const battleTypeEnum = pgEnum("battle_type", ["solo", "fleet"])
export const fleetRoleEnum = pgEnum("fleet_role", ["captain", "officer", "pilot"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("user").notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  rank: integer("rank").default(1).notNull(),
  track: text("track").default("javascript").notNull(),
  streak: integer("streak").default(0).notNull(),
  lastSeenAt: timestamp("last_seen_at"),
  streakFreezeUsedAt: timestamp("streak_freeze_used_at"),
  dailyGoalMissions: integer("daily_goal_missions").default(3).notNull(),
  weeklyGoalMissions: integer("weekly_goal_missions").default(10).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  showOnLeaderboard: boolean("show_on_leaderboard").default(false).notNull(),
  emailOptOut: boolean("email_opt_out").default(false).notNull(),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
})

export const tracks = pgTable("tracks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  characterClass: text("character_class").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
})

export const starSystems = pgTable(
  "star_systems",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    trackId: text("track_id").notNull().references(() => tracks.id),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    operationTitle: text("operation_title").notNull(),
    operationDescription: text("operation_description").notNull(),
    alternativeOperations: jsonb("alternative_operations").default([]),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.trackId, t.number)]
)

export const sectors = pgTable(
  "sectors",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    systemId: uuid("system_id").notNull().references(() => starSystems.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    theme: text("theme").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.systemId, t.number)]
)

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sectorId: uuid("sector_id").notNull().references(() => sectors.id, { onDelete: "cascade" }),
    systemId: uuid("system_id").notNull().references(() => starSystems.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    type: missionTypeEnum("type").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    description: text("description").notNull(),
    practicalExample: text("practical_example"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.sectorId, t.number)]
)

export const missionResources = pgTable("mission_resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
})

export const skillCheckQuestions = pgTable("skill_check_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: jsonb("options").notNull().$type<[string, string, string, string]>(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
})

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  starterCode: text("starter_code").notNull(),
  solution: text("solution").notNull(),
  hints: jsonb("hints").notNull().$type<string[]>(),
  displayOrder: integer("display_order").default(0).notNull(),
})

export const exerciseTests = pgTable("exercise_tests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  code: text("code").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
})

export const missionProgress = pgTable(
  "mission_progress",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id").notNull().references(() => missions.id),
    status: missionStatusEnum("status").default("NOT_STARTED").notNull(),
    minutesSpent: integer("minutes_spent").default(0).notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    usedFocusCycle: boolean("used_focus_cycle").default(false).notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [unique().on(t.userId, t.missionId)]
)

export const dailyLogs = pgTable(
  "daily_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    minutesStudied: integer("minutes_studied").default(0).notNull(),
    missionsCompleted: integer("missions_completed").default(0).notNull(),
  },
  (t) => [unique().on(t.userId, t.date)]
)

export const medals = pgTable(
  "medals",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    xpBonus: integer("xp_bonus").default(0).notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.slug)]
)

export const skillCheckAttempts = pgTable("skill_check_attempts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  missionId: uuid("mission_id").notNull().references(() => missions.id),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  perfect: boolean("perfect").notNull(),
  xpEarned: integer("xp_earned").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
})

export const missionNotes = pgTable(
  "mission_notes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id").notNull().references(() => missions.id),
    content: text("content").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.missionId)]
)

export const operations = pgTable(
  "operations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    trackId: text("track_id").notNull(),
    systemNumber: integer("system_number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    repoUrl: text("repo_url"),
    liveUrl: text("live_url"),
    status: operationStatusEnum("status").default("NOT_STARTED").notNull(),
    xpEarned: integer("xp_earned").default(0).notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [unique().on(t.userId, t.trackId, t.systemNumber)]
)

export const externalCourses = pgTable("external_courses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  totalLessons: integer("total_lessons").notNull(),
  completedLessons: integer("completed_lessons").default(0).notNull(),
  xpEarned: integer("xp_earned").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
})

export const starMapProgress = pgTable(
  "star_map_progress",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roadmapSlug: text("roadmap_slug").notNull(),
    nodeId: text("node_id").notNull(),
    nodeType: nodeTypeEnum("node_type").notNull(),
    status: nodeStatusEnum("status").default("NOT_STARTED").notNull(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [unique().on(t.userId, t.roadmapSlug, t.nodeId)]
)

export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
})

export const fleets = pgTable("fleets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tag: text("tag").unique().notNull(),
  emblem: text("emblem").default("🚀").notNull(),
  captainUserId: uuid("captain_user_id").notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const fleetMembers = pgTable(
  "fleet_members",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    fleetId: uuid("fleet_id").notNull().references(() => fleets.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: fleetRoleEnum("role").default("pilot").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.fleetId, t.userId)]
)

export const ships = pgTable("ships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").default("Scout Vessel").notNull(),
  baseHp: integer("base_hp").default(100).notNull(),
  baseAtk: integer("base_atk").default(10).notNull(),
  baseDef: integer("base_def").default(10).notNull(),
  baseSpd: integer("base_spd").default(10).notNull(),
  equippedSkinItemId: uuid("equipped_skin_item_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const items = pgTable("items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  type: itemTypeEnum("type").notNull(),
  rarity: itemRarityEnum("rarity").notNull(),
  creditCost: integer("credit_cost").notNull(),
  icon: text("icon").notNull(),
  bonusAtk: integer("bonus_atk").default(0).notNull(),
  bonusDef: integer("bonus_def").default(0).notNull(),
  bonusSpd: integer("bonus_spd").default(0).notNull(),
  bonusHp: integer("bonus_hp").default(0).notNull(),
  description: text("description").notNull(),
})

export const userInventory = pgTable(
  "user_inventory",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
    isEquipped: boolean("is_equipped").default(false).notNull(),
    acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.itemId)]
)

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  rarity: entityRarityEnum("rarity").notNull(),
  hp: integer("hp").notNull(),
  atk: integer("atk").notNull(),
  def: integer("def").notNull(),
  spd: integer("spd").notNull(),
  creditReward: integer("credit_reward").notNull(),
  xpReward: integer("xp_reward").notNull(),
  lootTable: jsonb("loot_table").notNull().$type<{ itemSlug: string; chance: number }[]>(),
  requiresFleet: boolean("requires_fleet").default(false).notNull(),
  icon: text("icon").default("👾").notNull(),
  description: text("description").notNull(),
})

export const battles = pgTable("battles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: uuid("entity_id").notNull().references(() => entities.id),
  type: battleTypeEnum("type").notNull(),
  status: battleStatusEnum("status").default("active").notNull(),
  fleetId: uuid("fleet_id"),
  entityHpRemaining: integer("entity_hp_remaining").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
})

export const battleParticipants = pgTable(
  "battle_participants",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    battleId: uuid("battle_id").notNull().references(() => battles.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    pilotHpRemaining: integer("pilot_hp_remaining").notNull(),
    totalDamageDealt: integer("total_damage_dealt").default(0).notNull(),
    hasFled: boolean("has_fled").default(false).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.battleId, t.userId)]
)

export const battleLog = pgTable("battle_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  battleId: uuid("battle_id").notNull().references(() => battles.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  damageDealt: integer("damage_dealt").default(0).notNull(),
  isCritical: boolean("is_critical").default(false).notNull(),
  description: text("description").notNull(),
  turnNumber: integer("turn_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type Track = typeof tracks.$inferSelect
export type StarSystem = typeof starSystems.$inferSelect
export type Sector = typeof sectors.$inferSelect
export type Mission = typeof missions.$inferSelect
export type MissionProgress = typeof missionProgress.$inferSelect
export type Medal = typeof medals.$inferSelect
export type Fleet = typeof fleets.$inferSelect
export type FleetMember = typeof fleetMembers.$inferSelect
export type Ship = typeof ships.$inferSelect
export type Item = typeof items.$inferSelect
export type UserInventory = typeof userInventory.$inferSelect
export type Entity = typeof entities.$inferSelect
export type Battle = typeof battles.$inferSelect
export type BattleParticipant = typeof battleParticipants.$inferSelect
export type BattleLog = typeof battleLog.$inferSelect
