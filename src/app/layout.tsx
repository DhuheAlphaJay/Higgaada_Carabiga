import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { CloudSync } from "@/components/providers/CloudSync";
import { MotionProvider } from "@/components/providers/MotionProvider";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "حروف | Baro Carabiga",
    template: "%s | حروف",
  },
  description:
    "Ciyaar madadaalo ah oo carruurta ku bartaan xarfaha Carabiga iyo higgaadda. Ku shaqaysaa taleefanka, tablet-ka, iyo laptop-ka.",
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="so" dir="ltr" className={`${cairo.variable} ${cairo.className} h-full`}>
      <body className="min-h-dvh font-sans text-ink antialiased">
        <MotionProvider>
          <CloudSync />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
