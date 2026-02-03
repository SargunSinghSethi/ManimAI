"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserVideos, getPresignedVideoUrl } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { Search, RefreshCcw, ExternalLink, Play, Calendar, Hash } from "lucide-react"
import type { Video, VideoResponse } from "@/lib/api"
import { CodeBlock } from "@/components/code-block"

export default function VideoHistoryPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [limit] = useState<number>(12)
  const [offset, setOffset] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>("")

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const filteredVideos = useMemo(() => {
    if (!query.trim()) return videos
    const q = query.toLowerCase()
    return videos.filter(
      (v) =>
        (v.title?.toLowerCase() ?? "").includes(q) ||
        (v.jobId?.toLowerCase() ?? "").includes(q) ||
        (v.id?.toLowerCase() ?? "").includes(q),
    )
  }, [query, videos])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const token = await getToken()
      if (!token) throw new Error("No token available")
        setIsInitialLoading(true)
        setError(null)
        
        const data = (await getUserVideos(limit, 0,token)) as VideoResponse
        if (cancelled) return
        setVideos(data.videos)
        setHasMore(data.pagination?.hasMore ?? data.videos.length >= limit)
        setOffset(data.pagination?.offset ?? data.videos.length)
      } catch (e: any) {
        setError(e?.message || "Failed to fetch videos")
      } finally {
        if (!cancelled) setIsInitialLoading(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [limit])

  useEffect(() => {
    if (!hasMore || isLoading) return
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore()
      },
      { rootMargin: "400px 0px 0px 0px", threshold: 0 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, isLoading, sentinelRef.current])

  async function loadMore() {
    if (isLoading || !hasMore) return
    try {
      const token = await getToken()
      if (!token) throw new Error("No token available")
      setIsLoading(true)
      setError(null)
      const data = (await getUserVideos(limit, offset,token)) as VideoResponse
      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id))
        return [...prev, ...data.videos.filter((v) => !seen.has(v.id))]
      })
      setHasMore(data.pagination?.hasMore ?? data.videos.length >= limit)
      setOffset((data.pagination?.offset ?? offset) + (data.pagination?.limit ?? data.videos.length))
    } catch (e: any) {
      setError(e?.message || "Failed to load more videos")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleView(video: Video) {
    setSelectedVideo(video)
    console.log(video)
    setVideoUrl(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("No token available")
      const res = await getPresignedVideoUrl(Number(video.id), token)
      setVideoUrl(res.presigned_url || res.url)
    } catch (err) {
      console.error("Failed to fetch video URL", err)
    }
  }

  function retry() {
    setVideos([])
    setOffset(0)
    setHasMore(true)
    setError(null)
    setIsInitialLoading(true)
    ;(async () => {
      try {
        const token = await getToken()
      if (!token) throw new Error("No token available")
        const data = (await getUserVideos(limit, 0, token)) as VideoResponse
        setVideos(data.videos)
        setHasMore(data.pagination?.hasMore ?? data.videos.length >= limit)
        setOffset(data.pagination?.offset ?? data.videos.length)
      } catch (e: any) {
        setError(e?.message || "Failed to fetch videos")
      } finally {
        setIsInitialLoading(false)
      }
    })()
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Video History
              </h1>
              <p className="text-muted-foreground mt-1">Manage and view your generated videos</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
              // className="pl-10 w-64  rounded-lg border border-input bg-background/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              className="pl-10 w-64 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-0 focus:border-primary focus:outline-primary/50"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                
              </div>
              <Button variant="outline" onClick={retry} className="bg-white">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden">
                <div className="aspect-video bg-slate-200 dark:bg-slate-700">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Play className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {query ? "Try adjusting your search terms" : "Start creating videos to see them here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-video bg-muted  flex items-center justify-center relative overflow-hidden">
                  <Play className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 ">
                    {video.title || "Untitled Video"}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono">{video.id}</span>
                    </div>
                  </div>

                  <Dialog
                    onOpenChange={(open) => {
                      if (!open) setSelectedVideo(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full" onClick={() => handleView(video)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Video
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-6xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-xl">{video.title || "Untitled Video"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh]">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">Video</h4>
                          {videoUrl ? (
                            <VideoPlayer videoUrl={videoUrl} />
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                              <Skeleton className="h-64 w-full rounded-lg" />
                              <p className="text-sm text-muted-foreground">Loading video...</p>
                            </div>
                          )}
                        </div>
                        <div className="overflow-auto">
                          <div className="border rounded-lg p-4 h-full">
                            <h4 className="font-semibold mb-3">Associated Code</h4>
                            {selectedVideo && (
                              <CodeBlock code={video.associatedCode ?? "No code available"} lang="python" />
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isInitialLoading && isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`loading-${i}`} className="overflow-hidden">
                <div className="aspect-video bg-slate-200 dark:bg-slate-700">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-8" />

        <div className="mt-8 flex items-center justify-center">
          {hasMore ? (
            isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                <span>Loading more videos...</span>
              </div>
            ) : (
              <Button variant="outline" onClick={() => loadMore()} className="bg-white dark:bg-slate-800">
                Load More Videos
              </Button>
            )
          ) : (
            <p className="text-muted-foreground text-sm">{filteredVideos.length > 0 ? "You've reached the end" : ""}</p>
          )}
        </div>

        {!isInitialLoading && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredVideos.length} of {videos.length} videos
            {hasMore && " (more available)"}
          </div>
        )}
      </div>
    </main>
  )
}
