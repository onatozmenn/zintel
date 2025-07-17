import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ZintelAI - Everything You Searched",
  description:
    "Advanced AI assistant powered by cutting-edge technology. Get intelligent answers, insights, and assistance for everything you search.",
  keywords: "AI, artificial intelligence, assistant, search, ZintelAI, intelligent, technology",
  authors: [{ name: "ZintelAI Team" }],
  openGraph: {
    title: "ZintelAI - Everything You Searched",
    description: "Advanced AI assistant powered by cutting-edge technology",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} dark`}>{children}</body>
    </html>
  )
}
