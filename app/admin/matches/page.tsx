"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TypingText } from "@/components/ui/typing-text"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Sword, Play, Check, Clock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock match data
const initialMatches = [
  {
    id: 1,
    teamA: { id: 1, name: "Team Alpha" },
    teamB: { id: 2, name: "Team Beta" },
    round: "quarterfinal",
    status: "completed",
    winner: { id: 1, name: "Team Alpha" },
  },
  {
    id: 2,
    teamA: { id: 3, name: "Team Gamma" },
    teamB: { id: 4, name: "Team Delta" },
    round: "quarterfinal",
    status: "in-progress",
    winner: null,
  },
  {
    id: 3,
    teamA: { id: 5, name: "Team Epsilon" },
    teamB: { id: 6, name: "Team Zeta" },
    round: "quarterfinal",
    status: "pending",
    winner: null,
  },
  {
    id: 4,
    teamA: { id: 7, name: "Team Eta" },
    teamB: { id: 8, name: "Team Theta" },
    round: "quarterfinal",
    status: "pending",
    winner: null,
  },
  {
    id: 5,
    teamA: { id: 1, name: "Team Alpha" },
    teamB: null,
    round: "semifinal",
    status: "pending",
    winner: null,
  },
]

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState(initialMatches)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-yellow-500 border-yellow-500">
            <Clock size={12} />
            <span>Pending</span>
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-accent border-accent">
            <Play size={12} />
            <span>In Progress</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-neon-green border-neon-green">
            <Check size={12} />
            <span>Completed</span>
          </Badge>
        )
      default:
        return null
    }
  }

  const getRoundBadge = (round: string) => {
    switch (round) {
      case "quarterfinal":
        return (
          <Badge variant="secondary" className="font-mono">
            QF
          </Badge>
        )
      case "semifinal":
        return (
          <Badge variant="secondary" className="font-mono">
            SF
          </Badge>
        )
      case "final":
        return <Badge className="bg-neon-green text-primary-foreground font-mono">F</Badge>
      default:
        return null
    }
  }

  const handleManageMatch = (matchId: number) => {
    router.push(`/admin/control?match=${matchId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neon-green">
          <TypingText text="MATCH MANAGEMENT" speed={50} />
        </h1>
      </div>

      <TerminalCard title="MATCH LIST">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Round</TableHead>
              <TableHead>Team A</TableHead>
              <TableHead>Team B</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Winner</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id} className="group">
                <TableCell className="font-mono">{match.id}</TableCell>
                <TableCell>{getRoundBadge(match.round)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Sword size={14} className="text-neon-green" />
                    <span>{match.teamA?.name || "TBD"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-secondary" />
                    <span>{match.teamB?.name || "TBD"}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(match.status)}</TableCell>
                <TableCell>{match.winner ? match.winner.name : "-"}</TableCell>
                <TableCell className="text-right">
                  <GlitchButton
                    size="sm"
                    variant={match.status === "in-progress" ? "default" : "outline"}
                    onClick={() => handleManageMatch(match.id)}
                    glitchColor={match.status === "in-progress" ? "green" : "blue"}
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="mr-1">Manage</span>
                    <ArrowRight size={14} />
                  </GlitchButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TerminalCard>
    </div>
  )
}
