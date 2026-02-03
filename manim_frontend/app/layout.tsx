import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/header"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Manim AI Generator",
  description: "Generate mathematical animations using natural language prompts powered by AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning suppressContentEditableWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex flex-col">
              <Header />
            {children}
            </div>
            <footer className="border-t border-border py-6">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>© 2025 Manim AI Generator. All rights reserved.</p>
              </div>
            </footer>
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
