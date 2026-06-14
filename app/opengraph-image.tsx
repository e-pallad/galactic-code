import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Galactic Code — Learn to code through epic space missions"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080C14",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>🚀</div>
        <div style={{ fontSize: 64, fontWeight: 700, color: "#06B6D4", letterSpacing: -2 }}>
          GALACTIC CODE
        </div>
        <div style={{ fontSize: 28, color: "#94a3b8", marginTop: 16 }}>
          Level up your skills. Earn XP. Rank up.
        </div>
      </div>
    ),
    size
  )
}
