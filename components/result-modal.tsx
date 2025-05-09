"use client"

import { useState, useEffect } from "react"
import { TerminalCard } from "@/components/ui/terminal-card"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Trophy, Clock, Shield, Sword, X } from "lucide-react"

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  results: {
    teamA: {
      name: string
      time?: number // in seconds, undefined if failed
      systemPromptLength?: number
    }
    teamB: {
      name: string
      time?: number // in seconds, undefined if failed
      systemPromptLength?: number
    }
    winner: string
  }
}

export function ResultModal({ isOpen, onClose, results }: ResultModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!isVisible) return null

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return "Failed"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <TerminalCard className="w-full max-w-lg border-neon-green glow relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted/50 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center py-6">
          <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-6">Match Results</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 rounded-md border ${results.winner === results.teamA.name ? "border-neon-green" : "border-muted"}`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sword size={16} className="text-neon-green" />
                <span className="font-bold">{results.teamA.name}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm">
                <Clock size={14} />
                <span>{formatTime(results.teamA.time)}</span>
              </div>
              {results.teamA.systemPromptLength !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  Prompt Length: {results.teamA.systemPromptLength} chars
                </div>
              )}
            </div>

            <div
              className={`p-4 rounded-md border ${results.winner === results.teamB.name ? "border-neon-green" : "border-muted"}`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield size={16} className="text-secondary" />
                <span className="font-bold">{results.teamB.name}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm">
                <Clock size={14} />
                <span>{formatTime(results.teamB.time)}</span>
              </div>
              {results.teamB.systemPromptLength !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  Prompt Length: {results.teamB.systemPromptLength} chars
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-bold mb-2 text-neon-green">Winner</h4>
            <div className="text-2xl font-bold">{results.winner}</div>
          </div>

          <GlitchButton onClick={onClose} glitchColor="purple">
            Close
          </GlitchButton>
        </div>
      </TerminalCard>
    </div>
  )
}
