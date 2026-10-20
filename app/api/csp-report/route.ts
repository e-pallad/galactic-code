import { NextResponse } from "next/server"

// Receives Content-Security-Policy-Report-Only violations (see next.config.ts) and
// writes one trimmed line per report to the function logs. Public by necessity —
// browsers send reports without credentials — so it stores nothing and caps the body.
const MAX_BYTES = 8 * 1024

export async function POST(req: Request) {
  const text = (await req.text().catch(() => "")).slice(0, MAX_BYTES)
  try {
    const parsed = JSON.parse(text) as { "csp-report"?: Record<string, unknown> }
    const r = parsed["csp-report"] ?? {}
    console.warn("[csp-report]", JSON.stringify({
      directive: r["violated-directive"],
      blocked: r["blocked-uri"],
      document: r["document-uri"],
    }))
  } catch {
    // not a CSP report; ignore
  }
  return new NextResponse(null, { status: 204 })
}
