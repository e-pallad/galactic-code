import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "../lib/db/schema"
import { eq } from "drizzle-orm"
import "dotenv/config"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log("Seeding demo data…")

  const tracksData: (typeof schema.tracks.$inferInsert)[] = [
    { id: "javascript", name: "JavaScript", characterClass: "Code Pilot", icon: "⚡", description: "Master the language of the web. Build interactive UIs, APIs, and full-stack apps." },
    { id: "python", name: "Python", characterClass: "Data Mage", icon: "🔮", description: "Wield the power of Python for data science, automation, and backend development." },
  ]

  for (const track of tracksData) {
    await db.insert(schema.tracks).values(track).onConflictDoNothing()
  }

  const [jsSystem] = await db
    .insert(schema.starSystems)
    .values({
      trackId: "javascript",
      number: 1,
      title: "JavaScript Foundations",
      description: "Master variables, functions, control flow, and the DOM. Your first month in the JS galaxy.",
      operationTitle: "Build an Interactive To-Do App",
      operationDescription: "Create a full-featured to-do app with add, complete, and delete functionality using vanilla JavaScript and the DOM API.",
    })
    .onConflictDoNothing()
    .returning()

  if (jsSystem) {
    const sectorData = [
      { systemId: jsSystem.id, number: 1, theme: "Variables & Data Types" },
      { systemId: jsSystem.id, number: 2, theme: "Functions & Control Flow" },
    ]

    for (const sectorRow of sectorData) {
      const [sector] = await db.insert(schema.sectors).values(sectorRow).onConflictDoNothing().returning()
      if (!sector) continue

      const missionData: (typeof schema.missions.$inferInsert)[] = sector.number === 1
        ? [
            { sectorId: sector.id, systemId: jsSystem.id, number: 1, title: "What is JavaScript?", type: "briefing", durationMinutes: 10, description: "JavaScript is the scripting language of the web. In this mission, you'll learn what JS is, how browsers execute it, and why it's the foundation of modern web development." },
            { sectorId: sector.id, systemId: jsSystem.id, number: 2, title: "Variables & let/const/var", type: "training-op", durationMinutes: 20, description: "Declare your first variables. Understand the difference between let, const, and var, and when to use each." },
            { sectorId: sector.id, systemId: jsSystem.id, number: 3, title: "Sector Debrief", type: "debrief", durationMinutes: 10, description: "Review everything from Sector 1. Consolidate your understanding of JS basics and data types." },
          ]
        : [
            { sectorId: sector.id, systemId: jsSystem.id, number: 4, title: "Declaring Functions", type: "briefing", durationMinutes: 15, description: "Functions are reusable blocks of code. Learn function declarations, expressions, and the differences between them." },
            { sectorId: sector.id, systemId: jsSystem.id, number: 5, title: "Arrow Functions & Closures", type: "training-op", durationMinutes: 25, description: "Arrow functions offer a concise syntax. Closures let inner functions access outer scope — a core JS concept." },
            { sectorId: sector.id, systemId: jsSystem.id, number: 6, title: "Control Flow Strike Mission", type: "strike-mission", durationMinutes: 30, description: "Build a number guessing game using if/else, loops, and user input. Apply your function knowledge in a real challenge." },
          ]

      for (const mission of missionData) {
        await db.insert(schema.missions).values(mission).onConflictDoNothing()
      }
    }
  }

  const [pySystem] = await db
    .insert(schema.starSystems)
    .values({
      trackId: "python",
      number: 1,
      title: "Python Foundations",
      description: "Learn Python syntax, data structures, and OOP fundamentals. Your first month as a Data Mage.",
      operationTitle: "Build a Data Analyzer CLI",
      operationDescription: "Create a command-line tool that reads a CSV file, computes statistics, and outputs a formatted report.",
    })
    .onConflictDoNothing()
    .returning()

  if (pySystem) {
    const [sector] = await db.insert(schema.sectors).values({ systemId: pySystem.id, number: 1, theme: "Python Basics" }).onConflictDoNothing().returning()
    if (sector) {
      await db.insert(schema.missions).values([
        { sectorId: sector.id, systemId: pySystem.id, number: 1, title: "Hello Python", type: "briefing", durationMinutes: 10, description: "Your first Python mission. Learn the syntax, run your first script, and understand Python's philosophy." },
        { sectorId: sector.id, systemId: pySystem.id, number: 2, title: "Lists & Dictionaries", type: "training-op", durationMinutes: 20, description: "Python's core data structures. Master lists and dicts to store and manipulate data effectively." },
      ]).onConflictDoNothing()
    }
  }

  const [firstUser] = await db.select().from(schema.users).limit(1)
  if (firstUser) {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, firstUser.id))
    console.log(`Set ${firstUser.email} as admin.`)
  }

  console.log("Seed complete.")
}

seed().catch(err => { console.error(err); process.exit(1) })
