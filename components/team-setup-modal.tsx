"use client"

import { useState, useEffect } from "react"
import { TerminalCard } from "@/components/ui/terminal-card"
import { GlitchButton } from "@/components/ui/glitch-button"
import { TerminalInput } from "@/components/ui/terminal-input"
import { X, Check } from "lucide-react"
import { TypingText } from "@/components/ui/typing-text"

interface TeamSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamsConfirmed: (teams: { id: number; name: string }[]) => void
}

export function TeamSetupModal({ isOpen, onClose, onTeamsConfirmed }: TeamSetupModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [teamNames, setTeamNames] = useState<string[]>(Array(8).fill(""))

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

  const handleSetTeams = () => {
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

          <div className="flex justify-center mt-6">
            <GlitchButton
              onClick={handleSetTeams}
              disabled={!allTeamsEntered}
              glitchColor="green"
              className="flex items-center gap-2"
            >
              <Check size={16} />
              <span>Set Teams</span>
            </GlitchButton>
          </div>
        </div>
      </TerminalCard>
    </div>
  )
}
