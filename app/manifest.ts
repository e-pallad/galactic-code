import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Galactic Code",
    short_name: "GalacticCode",
    description: "Space-themed RPG learning platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#080C14",
    theme_color: "#06B6D4",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcuts: [
      { name: "Command Bridge", url: "/dashboard", description: "Your main dashboard" },
      { name: "Academy", url: "/academy", description: "Browse missions" },
    ],
  }
}
