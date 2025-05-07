"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { JobStatus } from "@/components/job-status"
import { VideoPlayer } from "@/components/video-player"
import { CodeDisplay } from "@/components/code-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles } from "lucide-react"
import { checkJobStatus, submitPrompt } from "@/lib/api"

export default function PromptsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get("prompt") || ""
  const initialJobId = searchParams.get("jobId") || null

  const [prompt, setPrompt] = useState(initialPrompt)
  const [jobId, setJobId] = useState<string | null>(initialJobId)
  const [status, setStatus] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<number | null>(null)
  const [codeText, setCodeText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("preview")

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      setJobId(null)
      setStatus(null)
      setVideoId(null)
      setCodeText(null)

      // Submit prompt to backend
      const { jobId } = await submitPrompt(prompt)

      setJobId(jobId)
      setStatus("pending")

      // Update URL with new jobId and prompt
      router.push(`/prompts?jobId=${jobId}&prompt=${encodeURIComponent(prompt)}`)

      // Start polling for job status
      startPolling(jobId)
    } catch (err) {
      setError("Failed to submit prompt. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for job status
  const startPolling = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { status, videoId, codeText } = await checkJobStatus(jobId)
        setStatus(status)

        if (status === "completed" && videoId) {
          setVideoId(videoId)
          setCodeText(codeText || null)
          clearInterval(pollInterval)
        } else if (status === "failed") {
          setError("Animation generation failed. Please try a different prompt.")
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Error checking job status:", err)
      }
    }, 3000)

    // Clean up interval after 10 minutes (prevent infinite polling)
    setTimeout(
      () => {
        clearInterval(pollInterval)
        if (status !== "completed" && status !== "failed") {
          setStatus("timeout")
          setError("Request timed out. The animation might still be processing.")
        }
      },
      10 * 60 * 1000,
    )
  }

  // Check job status on initial load if jobId is provided
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId)
      startPolling(initialJobId)
    }
  }, [initialJobId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit(e)
    }
  }

  const examples = [
    "Transform a square to a circle",
    "Create a 3D rotating cube",
    "Demonstrate the Pythagorean theorem using a right angled traingle",
    "Show a sine wave forming on a graph",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Prompt and Job Status */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Animation Prompt</h2>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {jobId && status && <JobStatus status={status} />}

            <Card className="p-6 border border-border/40 bg-card/30 backdrop-blur">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
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
                  className="text-xs"
                  onClick={() => {
                    setPrompt(example)
                  }}
                >
                  <Sparkles className="mr-2 h-3 w-3" />
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {/* Right side - Video and Code Tabs */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Animation Result</h2>

            {videoId && codeText ? (
              <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Animation Preview</TabsTrigger>
                  <TabsTrigger value="code">Generated Code</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <VideoPlayer videoId={videoId} />
                </TabsContent>
                <TabsContent value="code" className="mt-4">
                  <CodeDisplay code={codeText} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="p-6 border border-border/40 bg-card/30 backdrop-blur flex items-center justify-center min-h-[300px]">
                <div className="text-center text-muted-foreground">
                  {jobId ? (
                    <p>Your animation is being processed. Results will appear here when ready.</p>
                  ) : (
                    <p>Submit a prompt to generate an animation.</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Manim AI Generator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
