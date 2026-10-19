import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { RANK_THRESHOLDS } from "@/lib/xp"

export const runtime = "edge"

function clampText(value: string | null, max: number, fallback: string): string {
  const text = (value ?? "").trim()
  return text ? Array.from(text).slice(0, max).join("") : fallback
}

function clampInt(value: string | null, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // Public and unauthenticated, so every parameter is bounded: nothing here can
  // be long enough to blow up the render, and the rank label always comes from
  // the rank itself rather than from free text.
  const type = searchParams.get("type") === "medal" ? "medal" : "rank"
  const name = clampText(searchParams.get("name"), 40, "Cadet")
  const rankNumber = clampInt(searchParams.get("rank"), 1, RANK_THRESHOLDS.length, 1)
  const rank = String(rankNumber)
  const label = RANK_THRESHOLDS[rankNumber - 1].label
  const xp = String(clampInt(searchParams.get("xp"), 0, 10_000_000, 0))
  const medal = clampText(searchParams.get("medal"), 60, "")
  const icon = Array.from(searchParams.get("icon") ?? "").slice(0, 2).join("") || "🏅"
  const description = clampText(searchParams.get("description"), 120, "")

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#080C14",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Star dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, #1e2d3d 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.5,
            display: "flex",
          }}
        />
        {/* Top gradient accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #06B6D4, #6366F1, #8B5CF6)",
            display: "flex",
          }}
        />
        {/* Brand */}
        <div
          style={{
            position: "absolute",
            top: "36px",
            left: "52px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#06B6D4",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "3px",
          }}
        >
          ⚡ GALACTIC CODE
        </div>

        {/* Main content */}
        {type !== "medal" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ fontSize: "88px", lineHeight: 1 }}>🏅</div>
            <div
              style={{
                fontSize: "18px",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "6px",
              }}
            >
              RANK {rank} ACHIEVED
            </div>
            <div
              style={{
                fontSize: "62px",
                fontWeight: 800,
                color: "#06B6D4",
                lineHeight: 1.1,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: "24px", color: "#e2e8f0", marginTop: "4px" }}>
              {Number(xp).toLocaleString()} XP earned
            </div>
            <div
              style={{
                marginTop: "20px",
                padding: "10px 28px",
                borderRadius: "9999px",
                border: "1px solid #1e2d3d",
                color: "#64748b",
                fontSize: "18px",
                display: "flex",
              }}
            >
              {name} · Galactic Code Academy
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ fontSize: "88px", lineHeight: 1 }}>{icon}</div>
            <div
              style={{
                fontSize: "18px",
                color: "#f59e0b",
                textTransform: "uppercase",
                letterSpacing: "6px",
              }}
            >
              MEDAL UNLOCKED
            </div>
            <div
              style={{
                fontSize: "56px",
                fontWeight: 800,
                color: "#e2e8f0",
                lineHeight: 1.1,
              }}
            >
              {medal}
            </div>
            {description && (
              <div style={{ fontSize: "22px", color: "#94a3b8", marginTop: "4px" }}>
                {description}
              </div>
            )}
            <div
              style={{
                marginTop: "20px",
                padding: "10px 28px",
                borderRadius: "9999px",
                border: "1px solid #1e2d3d",
                color: "#64748b",
                fontSize: "18px",
                display: "flex",
              }}
            >
              {name} · Galactic Code Academy
            </div>
          </div>
        )}

        {/* URL watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            right: "52px",
            color: "#1e2d3d",
            fontSize: "18px",
            display: "flex",
          }}
        >
          galacticcode.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
