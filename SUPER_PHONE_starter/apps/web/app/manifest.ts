import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SUPER PHONE",
    short_name: "SUPER PHONE",
    description: "سوق الأجهزة الإلكترونية للبيع والشراء والاستبدال في العراق",
    lang: "ar",
    dir: "rtl",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0b1728",
    theme_color: "#0b1728",
    prefer_related_applications: false,
    icons: [
      { src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/pwa-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}