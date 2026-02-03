"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Loader2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  videoUrl: string | null
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolumeControl, setShowVolumeControl] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffering, setBuffering] = useState(false)

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Handle video loading and playback events
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    const setVideoData = () => {
      setDuration(video.duration)
    }

    const updateTime = () => {
      setCurrentTime(video.currentTime)
    }

    const handleVideoEnd = () => {
      setIsPlaying(false)
      setShowControls(true)
    }

    const handleWaiting = () => {
      setBuffering(true)
    }

    const handlePlaying = () => {
      setBuffering(false)
    }

    // Add event listeners
    video.addEventListener("loadedmetadata", setVideoData)
    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("ended", handleVideoEnd)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)

    // Clean up
    return () => {
      video.removeEventListener("loadedmetadata", setVideoData)
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("ended", handleVideoEnd)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
    }
  }, [videoUrl])

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }
    }

    const player = playerRef.current
    if (player) {
      player.addEventListener("mousemove", handleMouseMove)
      player.addEventListener("mouseleave", () => {
        if (isPlaying) setShowControls(false)
      })
      player.addEventListener("mouseenter", () => setShowControls(true))
    }

    return () => {
      if (player) {
        player.removeEventListener("mousemove", handleMouseMove)
        player.removeEventListener("mouseleave", () => {
          if (isPlaying) setShowControls(false)
        })
        player.removeEventListener("mouseenter", () => setShowControls(true))
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return;
    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch((error) => {
        console.error('Play failed:', error);
      });
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    const video = videoRef.current
    if (!video) return

    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleFullscreen = () => {
    const player = playerRef.current
    if (!player) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      player.requestFullscreen()
    }
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, video.currentTime - 10)
  }

  const skipForward = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.min(video.duration, video.currentTime + 10)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Calculate progress percentage for custom progress bar
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0

  return (
    <Card className="overflow-hidden border border-border/40 bg-card/30 backdrop-blur shadow-lg rounded-xl">
      <div ref={playerRef} className="relative bg-black aspect-video cursor-pointer group" onClick={togglePlay}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            playsInline
            preload="metadata" // ✅ Only load metadata initially
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        )}

        {/* Buffering indicator */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        )}

        {/* Big play button overlay */}
        {!isPlaying && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300">
            <div className="rounded-full bg-primary/90 p-4 transform transition-transform duration-200 hover:scale-110">
              <Play className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Video controls overlay */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-6 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {/* Custom progress bar */}
          <div
            className="relative h-1 w-full bg-gray-700/50 rounded-full mb-4 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pos = (e.clientX - rect.left) / rect.width
              if (videoRef.current) {
                videoRef.current.currentTime = pos * duration
              }
            }}
          >
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="absolute top-0 left-0 h-full w-full opacity-0 hover:opacity-100">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer absolute inset-0 opacity-0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  skipBackward()
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                aria-label="Skip backward 10 seconds"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  skipForward()
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <span className="text-sm text-white ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div
                className="relative"
                onMouseEnter={() => setShowVolumeControl(true)}
                onMouseLeave={() => setShowVolumeControl(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>

                {showVolumeControl && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 border border-gray-700 p-2 rounded-lg w-24 shadow-lg">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFullscreen()
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                aria-label="Fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
