"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string
}

export function TerminalInput({ className, prefix = ">", ...props }: TerminalInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Blinking cursor effect
  useEffect(() => {
    if (!isFocused) return

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isFocused])

  return (
    <div className="relative flex items-center">
      <span className="text-neon-green mr-2 font-mono">{prefix}</span>
      <Input
        className={cn("bg-background/50 border-muted font-mono text-foreground caret-transparent", className)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {isFocused && (
        <span
          className={cn(
            "absolute right-3 h-4 w-2 bg-neon-green transition-opacity duration-100",
            cursorVisible ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  )
}
