"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useUser, useAuth } from '@clerk/nextjs';
import { submitPrompt } from "@/lib/api"
import { ArrowRight, Sparkles } from "lucide-react"

export function ManimGenerator() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !isSignedIn) return
    setIsLoading(true)
    setError(null)
    
    try {
      const token = await getToken();

        if (!token) {
        throw new Error('Authentication token not available');
      }

      
      // Submit prompt to backend
      const { jobUuid } = await submitPrompt(prompt,token)
  console.log(jobUuid)
      // Redirect to prompts page with the jobId and prompt
      router.push(`/prompts?jobId=${jobUuid}&prompt=${encodeURIComponent(prompt)}&status=PENDING`)
    } catch (err) {
      setError("Failed to submit prompt. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  const examples = [
    "Transform a square to a circle",
    "Create a 3D rotating cube",
    "Demonstrate the Pythagorean theorem using a right angled triangle",
    "Show a sine wave forming on a graph",
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card className="p-6 border border-border/40 bg-card/30 backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              ref={promptInputRef}
              placeholder="Describe the animation you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[120px] p-4 pr-12 rounded-lg border border-input bg-background/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-4 right-4 rounded-full"
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              <span className="sr-only">Submit</span>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">⌘</kbd> +{" "}
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">Enter</kbd> to submit
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button
            key={example}
            variant="outline"
            size="sm"
            className="text-xs whitespace-normal break-words max-w-xs sm:max-w-full "
            onClick={() => {
              setPrompt(example)
              if (promptInputRef.current) {
                promptInputRef.current.focus()
              }
            }}
          >
            <Sparkles className="mr-2 h-3 w-3 shrink-0" />
            {example}
          </Button>
        ))}
      </div>
    </div>
  )
}
