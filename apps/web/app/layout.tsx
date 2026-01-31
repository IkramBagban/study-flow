import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import "mafs/core.css";
import "mafs/font.css";

import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StudyFlow - Cognitive Minimalism Learning",
  description: "A brain-respecting learning platform designed to reduce cognitive noise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        {children}
        {/* Global SVG Filters for Visualizations */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
          <filter id="sketchy-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </svg>
        <Toaster />
      </body>
    </html>
  );
}
