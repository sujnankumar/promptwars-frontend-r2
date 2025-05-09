"use client"

import { useState, useEffect } from "react"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TypingText } from "@/components/ui/typing-text"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Activity, Users, Clock, Shield, Sword, Trophy, ArrowRight } from "lucide-react"

// Mock data
const teams = [
  { id: 1, name: "Team Alpha", wins: 2, losses: 0 },
  { id: 2, name: "Team Beta", wins: 1, losses: 1 },
  { id: 3, name: "Team Gamma", wins: 1, losses: 1 },
  { id: 4, name: "Team Delta", wins: 0, losses: 2 },
  { id: 5, name: "Team Epsilon", wins: 2, losses: 0 },
  { id: 6, name: "Team Zeta", wins: 1, losses: 1 },
  { id: 7, name: "Team Eta", wins: 1, losses: 1 },
  { id: 8, name: "Team Theta", wins: 0, losses: 2 },
]

const recentMatches = [
  { id: 1, attacker: "Team Alpha", defender: "Team Delta", winner: "Team Alpha", timestamp: "2023-05-08 14:30" },
  { id: 2, attacker: "Team Beta", defender: "Team Gamma", winner: "Team Gamma", timestamp: "2023-05-08 16:15" },
  { id: 3, attacker: "Team Epsilon", defender: "Team Theta", winner: "Team Epsilon", timestamp: "2023-05-09 10:45" },
]

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTeams, setActiveTeams] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Simulate random active teams
    const randomActive = setInterval(() => {
      setActiveTeams(Math.floor(Math.random() * 5) + 3)
    }, 5000)

    return () => {
      clearInterval(timer)
      clearInterval(randomActive)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neon-green">
          <TypingText text="ADMIN DASHBOARD" speed={50} />
        </h1>
        <div className="text-muted-foreground font-mono">{currentTime.toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TerminalCard className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-neon-green">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Tournament Status</div>
            <div className="text-xl font-bold text-neon-green">ACTIVE</div>
          </div>
        </TerminalCard>

        <TerminalCard className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-secondary">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Teams Online</div>
            <div className="text-xl font-bold text-secondary">{activeTeams}/8</div>
          </div>
        </TerminalCard>

        <TerminalCard className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-accent">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Matches Completed</div>
            <div className="text-xl font-bold text-accent">3/7</div>
          </div>
        </TerminalCard>

        <TerminalCard className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-yellow-500">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Tournament Phase</div>
            <div className="text-xl font-bold text-yellow-500">QUARTER-FINALS</div>
          </div>
        </TerminalCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerminalCard title="TEAM STANDINGS">
          <div className="space-y-2">
            {teams.slice(0, 5).map((team) => (
              <div key={team.id} className="flex items-center justify-between p-2 border-b border-muted last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{team.id}.</span>
                  <span>{team.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-neon-green">{team.wins}W</span>
                  <span className="text-destructive">{team.losses}L</span>
                </div>
              </div>
            ))}

            <GlitchButton
              variant="outline"
              size="sm"
              className="w-full mt-2 flex items-center justify-center gap-2"
              glitchColor="blue"
            >
              <span>View All Teams</span>
              <ArrowRight size={16} />
            </GlitchButton>
          </div>
        </TerminalCard>

        <TerminalCard title="RECENT MATCHES">
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <div key={match.id} className="p-3 border border-muted rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Match #{match.id}</div>
                  <div className="text-xs text-muted-foreground">{match.timestamp}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sword size={16} className="text-neon-green" />
                    <span className={match.winner === match.attacker ? "text-neon-green font-bold" : ""}>
                      {match.attacker}
                    </span>
                  </div>
                  <span className="text-xs">VS</span>
                  <div className="flex items-center gap-2">
                    <span className={match.winner === match.defender ? "text-neon-green font-bold" : ""}>
                      {match.defender}
                    </span>
                    <Shield size={16} className="text-secondary" />
                  </div>
                </div>

                <div className="mt-2 text-xs text-right">
                  Winner: <span className="text-neon-green">{match.winner}</span>
                </div>
              </div>
            ))}

            <GlitchButton
              variant="outline"
              size="sm"
              className="w-full mt-2 flex items-center justify-center gap-2"
              glitchColor="purple"
            >
              <span>View All Matches</span>
              <ArrowRight size={16} />
            </GlitchButton>
          </div>
        </TerminalCard>
      </div>
    </div>
  )
}
