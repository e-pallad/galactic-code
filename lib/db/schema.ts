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

export type User = typeof users.$inferSelect
export type Track = typeof tracks.$inferSelect
export type StarSystem = typeof starSystems.$inferSelect
export type Sector = typeof sectors.$inferSelect
export type Mission = typeof missions.$inferSelect
export type MissionProgress = typeof missionProgress.$inferSelect
export type Medal = typeof medals.$inferSelect
