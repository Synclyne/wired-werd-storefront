import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Werd | Streetwear E-Commerce",
    template: "%s | Werd"
  },
  description: "Shop a mobile-first streetwear collection with curated jackets, sneakers, bags, glasses, and essentials.",
  applicationName: "Werd",
  keywords: ["streetwear", "hoodies", "sneakers", "clothing ecommerce", "fashion"],
  authors: [{ name: "Werd" }],
  openGraph: {
    title: "Werd | New Collection",
    description: "Fashion-forward streetwear built on a fast, secure Next.js storefront.",
    url: siteUrl,
    siteName: "Werd",
    images: [
      {
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
        width: 1200,
        height: 630,
        alt: "Editorial streetwear campaign"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Werd | New Collection",
    description: "Curated streetwear, sneakers, and accessories.",
    images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"]
  },
  alternates: {
    canonical: "/"
  },
  appleWebApp: {
    capable: true,
    title: "Werd",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0b0b0b"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
