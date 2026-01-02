import type { Metadata } from "next";
import { Cormorant_Garamond, Syne } from "next/font/google";
import "./globals.css";

import { SmoothScroll } from "@/components/SmoothScroll";
import { CustomCursor } from "@/components/CustomCursor";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import Script from "next/script";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "ViGyanIT Academy | Excellence in Education",
  description: "A premier tutoring centre dedicated to cultivating exceptional minds through bespoke academic guidance and transformative learning experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${syne.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 65'><path d='M20 2L38 32.5L20 63L2 32.5L20 2Z' stroke='%23c9a962' stroke-width='2' fill='none'/><path d='M20 12L32 32.5L20 53L8 32.5L20 12Z' stroke='%23c9a962' stroke-width='1' fill='none'/></svg>" />
      </head>
      <body className="antialiased">
          <CustomCursor />
          <AccessibilityMenu />
          <SmoothScroll>
            {children}
          </SmoothScroll>
      </body>
    </html>
  );
}
