"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CodeDisplayProps {
  code: string
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <Card className="relative border border-border/40 bg-card/30 backdrop-blur">
      <div className="absolute right-4 top-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 bg-background/80 backdrop-blur"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
    </Card>
  )
}
