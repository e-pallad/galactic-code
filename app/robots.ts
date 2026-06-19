import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-up", "/sign-in", "/demo"],
        disallow: [
          "/api/",
          "/onboarding",
          "/dashboard",
          "/academy",
          "/character",
          "/settings",
          "/operations",
          "/star-map",
          "/sim-bay",
          "/mission-log",
          "/leaderboard",
          "/hangar",
          "/armory",
          "/combat",
          "/fleet",
          "/skill-check",
          "/focus",
          "/crew-bay",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
