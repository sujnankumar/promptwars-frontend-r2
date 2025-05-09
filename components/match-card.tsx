"use client"

import { useState, useEffect } from "react"
import { Shield, Sword, Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  matchId: number
  teamA: { id: number; name: string } | null
  teamB: { id: number; name: string } | null
  winner: { id: number; name: string } | null
  status: "pending" | "in-progress" | "completed"
  round: "quarterfinal" | "semifinal" | "final"
  onSelectWinner?: (winnerId: number) => void
  className?: string
}

export function MatchCard({ matchId, teamA, teamB, winner, status, round, onSelectWinner, className }: MatchCardProps) {
  const [isGlitching, setIsGlitching] = useState(false)

  // Glitch effect on status change
  useEffect(() => {
    setIsGlitching(true)
    const timeout = setTimeout(() => {
      setIsGlitching(false)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [status])

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "text-yellow-500"
      case "in-progress":
        return "text-accent"
      case "completed":
        return "text-neon-green"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock size={14} />
      case "in-progress":
        return <Sword size={14} />
      case "completed":
        return <Check size={14} />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden transition-all duration-300",
        status === "pending"
          ? "border-muted"
          : status === "in-progress"
            ? "border-accent glow-blue"
            : "border-neon-green glow",
        isGlitching && "glitch-effect",
        className,
      )}
      data-text={`Match #${matchId}`}
    >
      <div className="bg-muted/30 px-3 py-1.5 flex justify-between items-center border-b border-muted">
        <div className="text-xs font-mono">
          {round === "quarterfinal" ? "QF" : round === "semifinal" ? "SF" : "F"} #{matchId}
        </div>
        <div className={cn("flex items-center gap-1 text-xs", getStatusColor())}>
          {getStatusIcon()}
          <span>{status === "pending" ? "Pending" : status === "in-progress" ? "In Progress" : "Completed"}</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md transition-colors",
            winner?.id === teamA?.id ? "bg-muted/50 text-neon-green" : "hover:bg-muted/20",
            !teamA && "opacity-50",
          )}
          onClick={() => teamA && status === "completed" && onSelectWinner?.(teamA.id)}
        >
          <Sword size={16} className="text-neon-green" />
          <span className="font-bold">{teamA?.name || "TBD"}</span>
        </div>

        <div className="text-xs text-center text-muted-foreground">VS</div>

        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md transition-colors",
            winner?.id === teamB?.id ? "bg-muted/50 text-neon-green" : "hover:bg-muted/20",
            !teamB && "opacity-50",
          )}
          onClick={() => teamB && status === "completed" && onSelectWinner?.(teamB.id)}
        >
          <Shield size={16} className="text-secondary" />
          <span className="font-bold">{teamB?.name || "TBD"}</span>
        </div>
      </div>
    </div>
  )
}
