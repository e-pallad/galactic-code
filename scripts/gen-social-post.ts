/**
 * Generate (and optionally publish) social posts for Galactic Code.
 *
 * Usage:
 *   npx tsx scripts/gen-social-post.ts               # dry run: generate all contexts, print
 *   npx tsx scripts/gen-social-post.ts --post        # generate ONE post (context rotates daily) and publish
 *   npx tsx scripts/gen-social-post.ts --post --context 2   # publish a specific context
 *
 * Publishing targets are enabled by whichever env vars are set (all optional):
 *   Bluesky:  BLUESKY_IDENTIFIER (handle or email) + BLUESKY_APP_PASSWORD
 *   Mastodon: MASTODON_URL (instance base URL) + MASTODON_ACCESS_TOKEN
 *   X:        X_API_KEY + X_API_SECRET + X_ACCESS_TOKEN + X_ACCESS_SECRET
 *             (OAuth 1.0a user context; free tier allows POST /2/tweets)
 *
 * LinkedIn is generate-only (its posting API needs an interactive OAuth member
 * flow) — copy the printed text by hand.
 */
import Anthropic from "@anthropic-ai/sdk"
import { createHmac, randomBytes } from "crypto"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.app"

const CONTEXTS = [
  "Announcing that Galactic Code is a space-themed coding academy where you earn XP and rank up by completing missions. Target: developers who want structured learning with gamification.",
  "Highlighting the streak/Hyperdrive Charge feature — stay consistent and earn bonus XP. ADHD-friendly design with chunked missions and focus timers.",
  "Showcasing the ranking system: Cadet → Navigator → Ensign → Lieutenant → Commander → Captain → Fleet Captain → Admiral → Grand Admiral → Starfleet Legend. Each rank requires XP milestones.",
  "Promoting the Crew Bay real-time co-study feature — see other cadets online, study together.",
  "Sharing that full React, Node.js, and Next.js tracks are available — 3 star systems each, from fundamentals to production mastery — with more coming.",
  "Promoting the Combat Arena: XP and Credits earned from lessons buy ship gear, then you battle Void Entities solo or with your Fleet. Learning literally powers up your ship.",
  "Promoting the Sim Deck: in-browser React coding exercises with live tests — write code, watch the tests go green, earn XP. No local setup.",
  "Sharing the public curriculum pages — browse every mission in the React, Node.js, and Next.js tracks before signing up.",
]

async function generatePost(context: string, platform: "twitter" | "linkedin") {
  const constraints = platform === "twitter"
    ? `Max 250 characters (a link will be appended). No hashtags. Punchy, developer-focused. Use space/sci-fi metaphors naturally.`
    : "3-4 sentences. Professional but fun. Mention the learning + gamification angle. No hashtag spam."

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

// ─── publishers ──────────────────────────────────────────────────────────────

async function postToBluesky(text: string): Promise<string> {
  const identifier = process.env.BLUESKY_IDENTIFIER!
  const password = process.env.BLUESKY_APP_PASSWORD!
  const base = "https://bsky.social/xrpc"

  const sessionRes = await fetch(`${base}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  })
  if (!sessionRes.ok) throw new Error(`Bluesky login failed: ${sessionRes.status} ${await sessionRes.text()}`)
  const session = await sessionRes.json() as { accessJwt: string; did: string }

  // Make the trailing URL clickable via a link facet.
  const urlStart = text.indexOf(APP_URL)
  const encoder = new TextEncoder()
  const facets = urlStart >= 0 ? [{
    index: {
      byteStart: encoder.encode(text.slice(0, urlStart)).length,
      byteEnd: encoder.encode(text.slice(0, urlStart + APP_URL.length)).length,
    },
    features: [{ $type: "app.bsky.richtext.facet#link", uri: APP_URL }],
  }] : undefined

  const postRes = await fetch(`${base}/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: { $type: "app.bsky.feed.post", text, facets, createdAt: new Date().toISOString() },
    }),
  })
  if (!postRes.ok) throw new Error(`Bluesky post failed: ${postRes.status} ${await postRes.text()}`)
  const { uri } = await postRes.json() as { uri: string }
  return uri
}

async function postToMastodon(text: string): Promise<string> {
  const base = process.env.MASTODON_URL!.replace(/\/$/, "")
  const res = await fetch(`${base}/api/v1/statuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MASTODON_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ status: text, visibility: "public" }),
  })
  if (!res.ok) throw new Error(`Mastodon post failed: ${res.status} ${await res.text()}`)
  const { url } = await res.json() as { url: string }
  return url
}

function oauth1Header(method: string, url: string): string {
  const params: Record<string, string> = {
    oauth_consumer_key: process.env.X_API_KEY!,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: process.env.X_ACCESS_TOKEN!,
    oauth_version: "1.0",
  }
  const enc = encodeURIComponent
  const paramString = Object.keys(params).sort().map(k => `${enc(k)}=${enc(params[k])}`).join("&")
  const baseString = [method.toUpperCase(), enc(url), enc(paramString)].join("&")
  const signingKey = `${enc(process.env.X_API_SECRET!)}&${enc(process.env.X_ACCESS_SECRET!)}`
  params.oauth_signature = createHmac("sha1", signingKey).update(baseString).digest("base64")
  return "OAuth " + Object.keys(params).sort().map(k => `${enc(k)}="${enc(params[k])}"`).join(", ")
}

async function postToX(text: string): Promise<string> {
  const url = "https://api.twitter.com/2/tweets"
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: oauth1Header("POST", url) },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`X post failed: ${res.status} ${await res.text()}`)
  const { data } = await res.json() as { data: { id: string } }
  return `https://x.com/i/status/${data.id}`
}

const TARGETS = [
  { name: "Bluesky", enabled: () => !!(process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD), post: postToBluesky },
  { name: "Mastodon", enabled: () => !!(process.env.MASTODON_URL && process.env.MASTODON_ACCESS_TOKEN), post: postToMastodon },
  { name: "X", enabled: () => !!(process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET), post: postToX },
]

// ─── main ────────────────────────────────────────────────────────────────────

function dayOfYear(): number {
  const now = new Date()
  return Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000)
}

async function dryRun() {
  console.log("Dry run — generating all contexts (use --post to publish)\n")
  for (const context of CONTEXTS) {
    console.log("Context:", context.slice(0, 60) + "...\n")
    const tweet = await generatePost(context, "twitter")
    console.log("SHORT (X/Bluesky/Mastodon):")
    console.log(`${tweet}\n${APP_URL}`)
    console.log(`(${tweet.length} chars + link)\n`)
    const linkedin = await generatePost(context, "linkedin")
    console.log("LINKEDIN (copy by hand):")
    console.log(linkedin)
    console.log("\n" + "─".repeat(60) + "\n")
  }
}

async function publish(contextIndex: number) {
  const enabled = TARGETS.filter(t => t.enabled())
  if (enabled.length === 0) {
    console.error("No posting credentials configured. Set Bluesky/Mastodon/X env vars (see header comment).")
    process.exit(1)
  }

  const context = CONTEXTS[contextIndex % CONTEXTS.length]
  console.log(`Context [${contextIndex % CONTEXTS.length}]:`, context.slice(0, 80), "\n")

  const short = await generatePost(context, "twitter")
  const text = `${short}\n\n${APP_URL}`
  console.log(text, "\n")

  for (const target of enabled) {
    try {
      const ref = await target.post(text)
      console.log(`✓ ${target.name}: ${ref}`)
    } catch (err) {
      console.error(`✗ ${target.name}:`, err instanceof Error ? err.message : err)
      process.exitCode = 1
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const post = args.includes("--post")
  const ctxFlag = args.indexOf("--context")
  const contextIndex = ctxFlag >= 0 ? Number(args[ctxFlag + 1]) : dayOfYear()

  if (!post) return dryRun()
  if (!Number.isInteger(contextIndex)) {
    console.error("--context expects an integer")
    process.exit(1)
  }
  await publish(contextIndex)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
