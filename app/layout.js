import "./globals.css";

export const metadata = {
  title: "PRIME Tracker",
  description: "Your 28-week transformation to your prime physique.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
