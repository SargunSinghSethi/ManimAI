// CodeBlock.tsx
'use client'

import { JSX, useLayoutEffect, useState } from 'react'
import { BundledLanguage } from 'shiki/bundle/web'
import { highlight } from '@/lib/shared'
import { Button } from './ui/button'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  code: string
  lang: BundledLanguage
  initial?: JSX.Element
}

export function CodeBlock({ code, lang = "python", initial }: CodeBlockProps) {
  const [nodes, setNodes] = useState(initial)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    void highlight(code, "python").then(setNodes)
  }, [code, lang])

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
    <div className="relative border border-border/40 bg-card/30 backdrop-blur rounded-lg">
      <div className="absolute right-6 top-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8 bg-background/80 backdrop-blur"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="overflow-x-auto h-[350px] text-sm p-4 dark:bg-[#0a0c10]">
        {nodes ?? <p>Loading...</p>}
      </div>
    </div>
  )
}
