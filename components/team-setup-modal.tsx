"use client"

import { useState, useEffect } from "react"
import { TerminalCard } from "@/components/ui/terminal-card"
import { GlitchButton } from "@/components/ui/glitch-button"
import { TerminalInput } from "@/components/ui/terminal-input"
import { X, Users, Shuffle, Check } from "lucide-react"
import { TypingText } from "@/components/ui/typing-text"
import { cn } from "@/lib/utils"

interface TeamSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamsConfirmed: (teams: { id: number; name: string }[]) => void
}

export function TeamSetupModal({ isOpen, onClose, onTeamsConfirmed }: TeamSetupModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [teamNames, setTeamNames] = useState<string[]>(Array(8).fill(""))
  const [isAutoMatchup, setIsAutoMatchup] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [shuffledTeams, setShuffledTeams] = useState<{ id: number; name: string }[]>([])

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

  const handleTeamNameChange = (index: number, value: string) => {
    const newTeamNames = [...teamNames]
    newTeamNames[index] = value
    setTeamNames(newTeamNames)
  }

  const handleAutoMatchup = () => {
    setIsAutoMatchup(true)
    setIsShuffling(true)

    // Create shuffled teams array
    const teams = teamNames.map((name, index) => ({
      id: index + 1,
      name: name.trim() || `Team ${index + 1}`,
    }))

    // Simulate shuffling animation
    let shuffleCount = 0
    const maxShuffles = 10
    const shuffleInterval = setInterval(() => {
      // Shuffle the teams array
      const shuffled = [...teams].sort(() => Math.random() - 0.5)
      setShuffledTeams(shuffled)

      shuffleCount++
      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval)
        setIsShuffling(false)

        // Wait a moment before confirming
        setTimeout(() => {
          onTeamsConfirmed(shuffled)
          onClose()
        }, 1000)
      }
    }, 200)
  }

  const handleManualSetup = () => {
    const teams = teamNames.map((name, index) => ({
      id: index + 1,
      name: name.trim() || `Team ${index + 1}`,
    }))
    onTeamsConfirmed(teams)
    onClose()
  }

  const allTeamsEntered = teamNames.every((name) => name.trim() !== "")

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <TerminalCard className="w-full max-w-2xl border-neon-green relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted/50 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="py-4">
          <h3 className="text-2xl font-bold mb-6 text-center text-neon-green">
            <TypingText text="TOURNAMENT TEAM SETUP" speed={50} />
          </h3>

          {!isAutoMatchup ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {teamNames.map((name, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-sm text-muted-foreground">Team {index + 1}</label>
                    <TerminalInput
                      value={name}
                      onChange={(e) => handleTeamNameChange(index, e.target.value)}
                      placeholder={`Enter team ${index + 1} name...`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
                <GlitchButton
                  onClick={handleAutoMatchup}
                  variant="outline"
                  glitchColor="purple"
                  className="flex items-center gap-2"
                >
                  <Shuffle size={16} />
                  <span>Auto Matchup</span>
                </GlitchButton>

                <GlitchButton
                  onClick={handleManualSetup}
                  disabled={!allTeamsEntered}
                  glitchColor="green"
                  className="flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>Set Matchups</span>
                </GlitchButton>
              </div>
            </>
          ) : (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <Users size={48} className="text-neon-green animate-pulse" />
              </div>

              <h4 className="text-xl font-bold text-center mb-6">
                {isShuffling ? "Generating Matchups..." : "Matchups Confirmed!"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {Array.from({ length: 4 }).map((_, matchIndex) => {
                  const team1Index = matchIndex * 2
                  const team2Index = matchIndex * 2 + 1

                  return (
                    <div
                      key={matchIndex}
                      className={cn(
                        "border border-muted rounded-md p-4 transition-all duration-300",
                        isShuffling && "animate-pulse",
                      )}
                    >
                      <div className="text-xs text-muted-foreground mb-2">Quarterfinal {matchIndex + 1}</div>
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-neon-green">{shuffledTeams[team1Index]?.name || "..."}</div>
                        <div className="text-xs">VS</div>
                        <div className="font-bold text-secondary">{shuffledTeams[team2Index]?.name || "..."}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </TerminalCard>
    </div>
  )
}
