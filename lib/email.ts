import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? "Galactic Code <noreply@galacticcode.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const displayName = escapeHtml(name ?? "Cadet")
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to the Academy, " + (name ?? "Cadet") + " 🚀",
    html: `
      <div style="background:#080C14;color:#e2e8f0;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;border-radius:12px">
        <h1 style="color:#06B6D4;font-size:24px;margin-bottom:8px">Mission briefing received.</h1>
        <p style="color:#94a3b8;margin-bottom:24px">Welcome aboard, ${displayName}. Your cadet profile is active.</p>
        <p style="margin-bottom:8px">You've been assigned to the Academy. Your first mission awaits:</p>
        <ul style="color:#94a3b8;margin-bottom:24px;padding-left:20px">
          <li>Complete your onboarding to choose your track</li>
          <li>Earn XP with every mission you complete</li>
          <li>Maintain your Hyperdrive Charge (streak) for bonus XP</li>
        </ul>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#06B6D4;color:#080C14;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none">Launch Command Bridge →</a>
        <p style="color:#475569;font-size:12px;margin-top:32px">Galactic Code Academy · <a href="${APP_URL}/settings" style="color:#475569">Manage preferences</a></p>
      </div>
    `,
  })
}

export async function sendReEngagementEmail(to: string, name: string | null, streak: number) {
  const displayName = escapeHtml(name ?? "Cadet")
  const streakMsg = streak > 0
    ? `Your Hyperdrive Charge is at ${streak} day${streak !== 1 ? "s" : ""}. Don't let it die.`
    : "Your Hyperdrive Charge has reset. Relight it today."
  await resend.emails.send({
    from: FROM,
    to,
    subject: "⚡ Your hyperdrive is fading, " + (name ?? "Cadet"),
    html: `
      <div style="background:#080C14;color:#e2e8f0;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;border-radius:12px">
        <h1 style="color:#8B5CF6;font-size:24px;margin-bottom:8px">${displayName}, we've lost your signal.</h1>
        <p style="color:#94a3b8;margin-bottom:24px">${streakMsg}</p>
        <p style="margin-bottom:24px">One mission. 15 XP. That's all it takes to stay on course.</p>
        <a href="${APP_URL}/academy" style="display:inline-block;background:#6366F1;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none">Resume Mission →</a>
        <p style="color:#475569;font-size:12px;margin-top:32px">Galactic Code Academy · <a href="${APP_URL}/settings" style="color:#475569">Unsubscribe</a></p>
      </div>
    `,
  })
}

export async function sendWeeklySummaryEmail(
  to: string,
  name: string | null,
  stats: { xpThisWeek: number; missionsThisWeek: number; totalXp: number; streak: number; rankLabel: string }
) {
  const displayName = escapeHtml(name ?? "Cadet")
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Weekly debrief — ${stats.xpThisWeek} XP earned, ${name ?? "Cadet"}`,
    html: `
      <div style="background:#080C14;color:#e2e8f0;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;border-radius:12px">
        <h1 style="color:#06B6D4;font-size:24px;margin-bottom:8px">Weekly Debrief</h1>
        <p style="color:#94a3b8;margin-bottom:24px">Here's your mission report, ${displayName}.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
          <div style="background:#0d1520;padding:16px;border-radius:8px;border:1px solid #1e2d3d">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">XP This Week</p>
            <p style="font-size:28px;font-weight:700;color:#06B6D4;margin:0">${stats.xpThisWeek}</p>
          </div>
          <div style="background:#0d1520;padding:16px;border-radius:8px;border:1px solid #1e2d3d">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Missions</p>
            <p style="font-size:28px;font-weight:700;color:#10B981;margin:0">${stats.missionsThisWeek}</p>
          </div>
          <div style="background:#0d1520;padding:16px;border-radius:8px;border:1px solid #1e2d3d">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Rank</p>
            <p style="font-size:18px;font-weight:700;color:#8B5CF6;margin:0">${stats.rankLabel}</p>
          </div>
          <div style="background:#0d1520;padding:16px;border-radius:8px;border:1px solid #1e2d3d">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">Streak</p>
            <p style="font-size:28px;font-weight:700;color:#f59e0b;margin:0">🔥 ${stats.streak}</p>
          </div>
        </div>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#06B6D4;color:#080C14;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none">View Command Bridge →</a>
        <p style="color:#475569;font-size:12px;margin-top:32px">Galactic Code Academy · <a href="${APP_URL}/settings" style="color:#475569">Unsubscribe</a></p>
      </div>
    `,
  })
}
