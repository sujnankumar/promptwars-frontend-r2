"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TypingTextProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  onComplete?: () => void
}

export function TypingText({ text, className, speed = 50, delay = 0, onComplete }: TypingTextProps) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (delay > 0) {
      timeout = setTimeout(startTyping, delay)
    } else {
      startTyping()
    }

    function startTyping() {
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(interval)
          setIsComplete(true)
          if (onComplete) onComplete()
        }
      }, speed)

      return () => clearInterval(interval)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [text, speed, delay, onComplete])

  return <span className={cn("inline-block", !isComplete && "typing-animation", className)}>{displayText}</span>
}
