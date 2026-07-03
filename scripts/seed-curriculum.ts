import { db } from "@/lib/db"
import { and, eq, gte, sql } from "drizzle-orm"
import {
  tracks,
  starSystems,
  sectors,
  missions,
  skillCheckQuestions,
  exercises,
  exerciseTests,
} from "@/lib/db/schema"

import { reactSystems, nodeSystems, nextSystems, type SystemDef } from "./curriculum-data"

// Re-runnable: existing systems/sectors/missions are looked up instead of
// skipped. Skill checks and exercises upsert on (mission_id, display_order)
// so content edits reach already-seeded databases — upserting (not
// delete+reinsert) preserves exercise ids that exercise_progress points at.
// Rows past the current count are pruned.
async function seedSystem(trackId: string, sys: SystemDef) {
  let [system] = await db
    .insert(starSystems)
    .values({
      trackId,
      number: sys.number,
      title: sys.title,
      description: sys.description,
      operationTitle: sys.operationTitle,
      operationDescription: sys.operationDescription,
      publishedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning()

  if (!system) {
    ;[system] = await db
      .select()
      .from(starSystems)
      .where(and(eq(starSystems.trackId, trackId), eq(starSystems.number, sys.number)))
      .limit(1)
  }
  if (!system) return

  for (const sec of sys.sectors) {
    let [sector] = await db
      .insert(sectors)
      .values({ systemId: system.id, number: sec.number, theme: sec.theme })
      .onConflictDoNothing()
      .returning()

    if (!sector) {
      ;[sector] = await db
        .select()
        .from(sectors)
        .where(and(eq(sectors.systemId, system.id), eq(sectors.number, sec.number)))
        .limit(1)
    }
    if (!sector) continue

    for (const m of sec.missions) {
      let [mission] = await db
        .insert(missions)
        .values({
          sectorId: sector.id,
          systemId: system.id,
          number: m.number,
          title: m.title,
          type: m.type,
          durationMinutes: m.durationMinutes,
          description: m.description,
          practicalExample: m.practicalExample,
          publishedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning()

      if (!mission) {
        ;[mission] = await db
          .select()
          .from(missions)
          .where(and(eq(missions.sectorId, sector.id), eq(missions.number, m.number)))
          .limit(1)
      }
      if (!mission) continue

      if (m.skillChecks) {
        await db
          .insert(skillCheckQuestions)
          .values(
            m.skillChecks.map((q, i) => ({
              missionId: mission.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              displayOrder: i,
            }))
          )
          .onConflictDoUpdate({
            target: [skillCheckQuestions.missionId, skillCheckQuestions.displayOrder],
            set: {
              question: sql`excluded.question`,
              options: sql`excluded.options`,
              correctIndex: sql`excluded.correct_index`,
              explanation: sql`excluded.explanation`,
            },
          })
        await db
          .delete(skillCheckQuestions)
          .where(and(eq(skillCheckQuestions.missionId, mission.id), gte(skillCheckQuestions.displayOrder, m.skillChecks.length)))
      }

      if (m.exercises) {
        for (let ei = 0; ei < m.exercises.length; ei++) {
          const ex = m.exercises[ei]
          const [exercise] = await db
            .insert(exercises)
            .values({
              missionId: mission.id,
              title: ex.title,
              description: ex.description,
              starterCode: ex.starterCode,
              solution: ex.solution,
              hints: ex.hints,
              displayOrder: ei,
            })
            .onConflictDoUpdate({
              target: [exercises.missionId, exercises.displayOrder],
              set: {
                title: sql`excluded.title`,
                description: sql`excluded.description`,
                starterCode: sql`excluded.starter_code`,
                solution: sql`excluded.solution`,
                hints: sql`excluded.hints`,
              },
            })
            .returning()

          if (!exercise) continue

          // Tests carry no user data — safe to refresh wholesale.
          await db.delete(exerciseTests).where(eq(exerciseTests.exerciseId, exercise.id))
          if (ex.tests.length > 0) {
            await db
              .insert(exerciseTests)
              .values(
                ex.tests.map((t, ti) => ({
                  exerciseId: exercise.id,
                  description: t.description,
                  code: t.code,
                  displayOrder: ti,
                }))
              )
          }
        }
        // Prune exercises removed from the curriculum (cascades tests + progress).
        await db
          .delete(exercises)
          .where(and(eq(exercises.missionId, mission.id), gte(exercises.displayOrder, m.exercises.length)))
      }
    }
  }
}
// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🚀 Seeding full curriculum...")

  await db.insert(tracks).values([
    {
      id: "react",
      name: "React",
      characterClass: "Reactor Pilot",
      icon: "⚛️",
      description: "Build dynamic UIs with the most popular frontend library. From JSX to advanced patterns.",
      isActive: true,
    },
    {
      id: "nodejs",
      name: "Node.js",
      characterClass: "Systems Engineer",
      icon: "🖥️",
      description: "Master server-side JavaScript. Build APIs, CLI tools, and production backend systems.",
      isActive: true,
    },
    {
      id: "nextjs",
      name: "Next.js",
      characterClass: "Warp Architect",
      icon: "🌐",
      description: "Ship full-stack React apps at warp speed. SSR, App Router, and production SaaS patterns.",
      isActive: true,
    },
  ]).onConflictDoNothing()

  console.log("✓ Tracks seeded")

  for (const sys of reactSystems) {
    await seedSystem("react", sys)
    console.log(`✓ React System ${sys.number}: ${sys.title}`)
  }

  for (const sys of nodeSystems) {
    await seedSystem("nodejs", sys)
    console.log(`✓ Node.js System ${sys.number}: ${sys.title}`)
  }

  for (const sys of nextSystems) {
    await seedSystem("nextjs", sys)
    console.log(`✓ Next.js System ${sys.number}: ${sys.title}`)
  }

  console.log("✅ Full curriculum seeded!")
  process.exit(0)
}

seed().catch(err => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
