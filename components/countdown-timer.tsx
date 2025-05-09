"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  duration: number // in seconds
  onComplete: () => void
  isRunning: boolean
  className?: string
}

export function CountdownTimer({ duration, onComplete, isRunning, className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isLowTime, setIsLowTime] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1
          if (newTime <= 60 && !isLowTime) {
            setIsLowTime(true)
          }
          return newTime
        })
      }, 1000)
    } else if (timeRemaining === 0 && isRunning) {
      onComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeRemaining, onComplete, isLowTime])

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(duration)
    setIsLowTime(false)
  }, [duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progressValue = (timeRemaining / duration) * 100

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Clock size={18} className={cn(isLowTime && "animate-pulse", isLowTime ? "text-destructive" : "text-accent")} />
        <span
          className={cn(
            "font-mono text-xl",
            isLowTime && "animate-pulse",
            isLowTime ? "text-destructive" : "text-accent",
          )}
        >
          {formatTime(timeRemaining)}
        </span>
      </div>
      <Progress
        value={progressValue}
        className={cn("h-2 transition-all", progressValue <= 25 ? "bg-destructive/20" : "bg-accent/20")}
      />
    </div>
  )
}
