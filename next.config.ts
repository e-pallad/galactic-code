import type { NextConfig } from "next"

// A Content-Security-Policy is deliberately not set here yet: it has to allow Clerk,
// the Sandpack bundler iframes and Vercel Analytics, and wants a report-only rollout first.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
]

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }, { protocol: "https", hostname: "images.clerk.dev" }] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}
export default nextConfig
