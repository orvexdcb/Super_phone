import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SUPER PHONE",
    short_name: "SUPER PHONE",
    description: "سوق الأجهزة الإلكترونية",
    start_url: "/",
    display: "standalone",
    background_color: "#08152F",
    theme_color: "#08152F",
    icons: [
      {
        src: "/pwa-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}