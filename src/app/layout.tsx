import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { CloudSync } from "@/components/providers/CloudSync";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { MotionProvider } from "@/components/providers/MotionProvider";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  applicationName: "Xuruuf",
  title: {
    default: "حروف | Baro Carabiga",
    template: "%s | حروف",
  },
  description: "Baro xarfaha iyo higgaadda Carabiga adigoo ciyaaraya",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Xuruuf",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="so" dir="ltr" className={`${cairo.variable} ${cairo.className} h-full`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh font-sans text-ink antialiased">
        <MotionProvider>
          <CloudSync />
          <PwaRegister />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
