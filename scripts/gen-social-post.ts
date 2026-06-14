import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CONTEXTS = [
  "Announcing that Galactic Code is a space-themed coding academy where you earn XP and rank up by completing missions. Target: developers who want structured learning with gamification.",
  "Highlighting the streak/Hyperdrive Charge feature — stay consistent and earn bonus XP. ADHD-friendly design with chunked missions and focus timers.",
  "Showcasing the ranking system: Cadet → Navigator → Ensign → Lieutenant → Commander → Captain → Fleet Captain → Admiral → Grand Admiral → Starfleet Legend. Each rank requires XP milestones.",
  "Promoting the Crew Bay real-time co-study feature — see other cadets online, study together.",
  "Sharing that JavaScript and Python tracks are available, with more coming.",
]

async function generatePost(context: string, platform: "twitter" | "linkedin") {
  const constraints = platform === "twitter"
    ? "Max 280 characters. No hashtags. Punchy, developer-focused. Use space/sci-fi metaphors naturally."
    : "3-4 sentences. Professional but fun. Mention the learning + gamification angle. No hashtags spam."

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Write a ${platform} post for Galactic Code — a space-themed coding learning platform.\n\nContext: ${context}\n\nConstraints: ${constraints}\n\nReturn only the post text, nothing else.`,
    }],
  })

  return (response.content[0] as { type: string; text: string }).text.trim()
}

async function main() {
  console.log("Generating social media posts for Galactic Code...\n")

  for (const context of CONTEXTS) {
    console.log("Context:", context.slice(0, 60) + "...\n")

    const tweet = await generatePost(context, "twitter")
    console.log("TWITTER:")
    console.log(tweet)
    console.log(`(${tweet.length} chars)\n`)

    const linkedin = await generatePost(context, "linkedin")
    console.log("LINKEDIN:")
    console.log(linkedin)
    console.log("\n" + "─".repeat(60) + "\n")
  }
}

main().catch(console.error)
