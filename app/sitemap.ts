import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/sign-up`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.9 },
    { url: `${base}/sign-in`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/demo`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pilots`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    // Active track ids are stable; system pages are discovered via links on these.
    { url: `${base}/curriculum`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/curriculum/react`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/curriculum/nodejs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/curriculum/nextjs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ]
}
