import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Afia-Smart Hospital Information System",
    short_name: "Afia-Smart",
    description: "Système hospitalier intégré pour patients, soins, pharmacie, laboratoire, chirurgie, facturation et reporting.",
    start_url: "/fr/overview",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8",
    categories: ["medical", "health", "productivity"],
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
