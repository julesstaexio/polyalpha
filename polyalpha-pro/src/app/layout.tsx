import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { TopNav } from "@/components/layout/top-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolyAlpha | AI-Powered Prediction Market Trading",
  description:
    "Trade Polymarket prediction markets with AI analysis, quantitative signals, and automated trading bots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <TopNav />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
