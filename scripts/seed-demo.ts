import { db } from "@/lib/db"
import { tracks, starSystems, sectors, missions, users } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

async function seed() {
  console.log("🚀 Seeding demo data...")

  // Insert tracks
  await db.insert(tracks).values([
    { id: "javascript", name: "JavaScript", characterClass: "Code Pilot", icon: "⚡", description: "Master JavaScript from fundamentals to full-stack web development." },
    { id: "python", name: "Python", characterClass: "Data Mage", icon: "🔮", description: "Wield Python for data science, automation, and backend systems." },
  ]).onConflictDoNothing()

  console.log("✓ Tracks seeded")

  // Insert star systems
  const [jsSystem] = await db.insert(starSystems).values({
    trackId: "javascript",
    number: 1,
    title: "JavaScript Foundations",
    description: "Master the core pillars of JavaScript: variables, functions, and control flow.",
    operationTitle: "Build a CLI Calculator",
    operationDescription: "Create a command-line calculator that handles basic arithmetic operations using pure JavaScript.",
  }).onConflictDoNothing().returning()

  const [pySystem] = await db.insert(starSystems).values({
    trackId: "python",
    number: 1,
    title: "Python Foundations",
    description: "Learn Python syntax, data types, and foundational programming concepts.",
    operationTitle: "Build a Data Analyzer",
    operationDescription: "Create a Python script that reads a CSV file and outputs statistical summaries.",
  }).onConflictDoNothing().returning()

  console.log("✓ Star systems seeded")

  // Create sectors for JS system
  if (jsSystem) {
    const jsSectors = await db.insert(sectors).values([
      { systemId: jsSystem.id, number: 1, theme: "Variables & Data Types" },
      { systemId: jsSystem.id, number: 2, theme: "Functions & Scope" },
    ]).onConflictDoNothing().returning()

    if (jsSectors[0]) {
      await db.insert(missions).values([
        { sectorId: jsSectors[0].id, systemId: jsSystem.id, number: 1, title: "Introduction to Variables", type: "briefing", durationMinutes: 15, description: "Learn about var, let, and const and when to use each one." },
        { sectorId: jsSectors[0].id, systemId: jsSystem.id, number: 2, title: "Data Types Deep Dive", type: "training-op", durationMinutes: 25, description: "Explore strings, numbers, booleans, null, undefined, and objects." },
        { sectorId: jsSectors[0].id, systemId: jsSystem.id, number: 3, title: "Variables Review", type: "debrief", durationMinutes: 10, description: "Consolidate your understanding of JavaScript variables and data types." },
      ]).onConflictDoNothing()
    }

    if (jsSectors[1]) {
      await db.insert(missions).values([
        { sectorId: jsSectors[1].id, systemId: jsSystem.id, number: 1, title: "Function Basics", type: "briefing", durationMinutes: 15, description: "Understand function declarations, expressions, and arrow functions." },
        { sectorId: jsSectors[1].id, systemId: jsSystem.id, number: 2, title: "Scope & Closures", type: "strike-mission", durationMinutes: 30, description: "Master lexical scope and build your first closures." },
        { sectorId: jsSectors[1].id, systemId: jsSystem.id, number: 3, title: "Functions Review", type: "debrief", durationMinutes: 10, description: "Review function patterns and scope rules." },
      ]).onConflictDoNothing()
    }

    console.log("✓ JS missions seeded")
  }

  // Create sectors for Python system
  if (pySystem) {
    const pySectors = await db.insert(sectors).values([
      { systemId: pySystem.id, number: 1, theme: "Python Basics" },
      { systemId: pySystem.id, number: 2, theme: "Collections & Loops" },
    ]).onConflictDoNothing().returning()

    if (pySectors[0]) {
      await db.insert(missions).values([
        { sectorId: pySectors[0].id, systemId: pySystem.id, number: 1, title: "Hello, Python", type: "briefing", durationMinutes: 10, description: "Your first Python program and understanding the interpreter." },
        { sectorId: pySectors[0].id, systemId: pySystem.id, number: 2, title: "Variables & Types", type: "training-op", durationMinutes: 20, description: "Python's dynamic typing system and core data types." },
        { sectorId: pySectors[0].id, systemId: pySystem.id, number: 3, title: "Basics Review", type: "debrief", durationMinutes: 10, description: "Review Python fundamentals." },
      ]).onConflictDoNothing()
    }

    if (pySectors[1]) {
      await db.insert(missions).values([
        { sectorId: pySectors[1].id, systemId: pySystem.id, number: 1, title: "Lists & Tuples", type: "briefing", durationMinutes: 15, description: "Python's sequence types and their operations." },
        { sectorId: pySectors[1].id, systemId: pySystem.id, number: 2, title: "Loops & Comprehensions", type: "training-op", durationMinutes: 25, description: "Master for loops, while loops, and list comprehensions." },
        { sectorId: pySectors[1].id, systemId: pySystem.id, number: 3, title: "Collections Review", type: "debrief", durationMinutes: 10, description: "Consolidate your knowledge of Python collections." },
      ]).onConflictDoNothing()
    }

    console.log("✓ Python missions seeded")
  }

  // Set first user as admin
  const [firstUser] = await db.select().from(users).orderBy(asc(users.createdAt)).limit(1)
  if (firstUser) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, firstUser.id))
    console.log(`✓ Set ${firstUser.email} as admin`)
  } else {
    console.log("ℹ No users found — skipping admin promotion")
  }

  console.log("✅ Seed complete!")
  process.exit(0)
}

seed().catch(err => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
