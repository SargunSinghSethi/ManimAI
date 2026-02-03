"use client";

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { JobStatus } from "@/components/job-status"
import { VideoPlayer } from "@/components/video-player"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles } from "lucide-react"
import { checkJobStatus, getPresignedVideoUrl, submitPrompt } from "@/lib/api"
import { useUser, useAuth } from "@clerk/nextjs"
import { CodeBlock } from "@/components/code-block"

export default function PromptsClient() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPrompt = searchParams.get("prompt") || "";
  const initialJobId = searchParams.get("jobId") || null;
  const initialStatus = searchParams.get("status") || null;

  const [prompt, setPrompt] = useState(initialPrompt);
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [videoId, setVideoId] = useState<number | null>(null);
  const [codeText, setCodeText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [urlExpiryTime, setUrlExpiryTime] = useState<number | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !isSignedIn) return;
    setIsLoading(true);
    setError(null);
    setJobId(null);
    setStatus("PENDING");
    setVideoId(null);
    setCodeText(null);
    setUrlExpiryTime(null);
    setVideoUrl(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not available");
      }

      // Submit prompt to backend
      const { jobUuid } = await submitPrompt(prompt, token);

      setJobId(jobUuid);
      // Update URL with new jobId and prompt
      router.push(
        `/prompts?jobId=${jobUuid}&prompt=${encodeURIComponent(prompt)}&status=${status ? status : "PENDING"
        }`
      );

      // Start polling for job status
      startPolling(jobUuid);
    } catch (err) {
      setError("Failed to submit prompt. Please try again.");
      console.error(err);
    }
  };

  // Poll for job status
  const startPolling = async (jobId: string) => {
    let isFinished = false;
    const pollInterval = setInterval(async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token not available");

        const { status, videoId, codeText } = await checkJobStatus(jobId, token);
        const normalizedStatus = status.toUpperCase();
        setStatus(normalizedStatus);

        router.replace(
          `/prompts?jobId=${jobId}&prompt=${encodeURIComponent(
            prompt
          )}&status=${normalizedStatus}`,
          { scroll: false }
        );

        if (normalizedStatus === "COMPLETED" && videoId) {
          setVideoId(videoId);
          setCodeText(codeText || null);
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          setIsLoading(false);
          isFinished = true;
        } else if (normalizedStatus === "FAILED") {
          setError("Animation generation failed. Please try a different prompt.");
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          setIsLoading(false);
          isFinished = true;
        }
      } catch (err) {
        console.error("Error checking job status:", err);
      }
    }, 10 * 1000);

    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        clearInterval(pollInterval);
        setStatus("TIMEOUT"); // match JobStatus.tsx
        setError(
          "Request timed out. The animation might still be processing."
        );

        router.replace(
          `/prompts?jobId=${jobId}&prompt=${encodeURIComponent(
            prompt
          )}&status=TIMEOUT`,
          { scroll: false }
        );
      }
    }, 10 * 60 * 1000);
  };

  // Check job status on initial load if jobId is provided
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      startPolling(initialJobId);
    }
  }, [initialJobId]);

  useEffect(() => {
    async function fetchVideoUrl() {
      if (!videoId) return;

      // ✅ If cached URL is still valid, reuse it
      if (
        videoUrl &&
        urlExpiryTime &&
        Date.now() < urlExpiryTime - 5 * 60 * 1000
      ) {
        console.log("♻️ Using cached presigned URL");
        return;
      }

      try {
        const token = await getToken();
        if (!token) throw new Error("No token available");

        const response = await getPresignedVideoUrl(videoId, token);
        const presignedUrl = response.presigned_url || response.url;

        if (!presignedUrl) throw new Error("No presigned URL received");

        setVideoUrl(presignedUrl);
        const expiresIn = response.expires_in || 3600; // default 1h
        setUrlExpiryTime(Date.now() + expiresIn * 1000);
      } catch (err) {
        console.error("Failed to fetch presigned URL", err);
        setVideoUrl(null);
      }
    }

    fetchVideoUrl();
  }, [videoId, getToken]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const examples = [
    "Transform a square to a circle",
    "Create a 3D rotating cube",
    "Demonstrate the Pythagorean theorem using a right angled triangle",
    "Show a sine wave forming on a graph",
  ];

  return (
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
                  disabled={isLoading || !prompt.trim() || status != "COMPLETED"}
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
                Press{" "}
                <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">
                  ⌘
                </kbd>{" "}
                +{" "}
                <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px]">
                  Enter
                </kbd>{" "}
                to submit
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
                  setPrompt(example);
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
            <Tabs
              defaultValue="preview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Animation Preview</TabsTrigger>
                <TabsTrigger value="code">Generated Code</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-4">
                <VideoPlayer videoUrl={videoUrl} />
              </TabsContent>
              <TabsContent value="code" className="">
                <CodeBlock code={codeText} lang="python" />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-6 border border-border/40 bg-card/30 backdrop-blur flex items-center justify-center min-h-[300px]">
              <div className="text-center text-muted-foreground">
                {jobId ? (
                  <p>
                    Your animation is being processed. Results will appear here
                    when ready.
                  </p>
                ) : (
                  <p>Submit a prompt to generate an animation.</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
