import type { NextConfig } from "next"

// The CSP ships as Report-Only first: it has to allow Clerk, the Sandpack bundler
// iframes and Vercel Analytics, and the allow-list below is a first draft. Violations
// are logged by /api/csp-report; tighten, then switch the header name to enforce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://vitals.vercel-insights.com https://*.codesandbox.io",
  "frame-src 'self' https://*.codesandbox.io https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "report-uri /api/csp-report",
].join("; ")

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
]

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }, { protocol: "https", hostname: "images.clerk.dev" }] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}
export default nextConfig
