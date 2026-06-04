import "./globals.css";
import PWA from "@/components/PWA";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  metadataBase: new URL("https://my-prime-tracker.vercel.app"),
  title: { default: "PRIME Tracker — your 28-week transformation", template: "%s · PRIME Tracker" },
  description: "Personalised calorie & macro targets, Indian diet plans with recipes, guided workouts with demo videos, and progress photos — your private fitness coach.",
  applicationName: "PRIME Tracker",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", type: "image/png", sizes: "192x192" }], apple: "/icon-180.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "PRIME" },
  openGraph: {
    title: "PRIME Tracker — build your prime physique",
    description: "Calorie engine, Indian recipes, workouts with videos, and progress tracking. Free & private.",
    type: "website",
    images: ["/icon.svg"],
  },
  twitter: { card: "summary", title: "PRIME Tracker", description: "Your private 28-week transformation tracker." },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PWA />
        <Analytics />
      </body>
    </html>
  );
}
