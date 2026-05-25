import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Werd Streetwear",
    short_name: "Werd",
    description: "A fast, mobile-first streetwear storefront.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f1",
    theme_color: "#0b0b0b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
