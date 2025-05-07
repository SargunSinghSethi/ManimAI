import { Header } from "@/components/header"
import { ManimGenerator } from "@/components/manim-generator"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-12 mt-16">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
            What animation can I help you create?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate mathematical animations using natural language prompts powered by AI
          </p>
        </div>
        <ManimGenerator />
      </main>
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Manim AI Generator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
