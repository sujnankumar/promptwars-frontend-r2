"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "@/lib/axios"
import { toast } from "@/hooks/use-toast"
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
  const [loading, setLoading] = useState(false)
  const [tournamentId, setTournamentId] = useState<string | null>(null)

  // Fetch matches from backend on mount
  useEffect(() => {
    const tid = typeof window !== "undefined" ? localStorage.getItem("tournamentId") : null
    setTournamentId(tid)
    if (!tid) return
    setLoading(true)
    axios.get(`/matches`, { params: { tournament_id: tid } })
      .then(res => {
        if (Array.isArray(res.data)) {
          setMatches(res.data)
        }
      })
      .catch(e => {
        toast({
          title: "Failed to load matches",
          description: e?.response?.data?.message || e?.message || "Could not fetch matches from backend.",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  // Save all matches to backend
  const saveMatches = async (newMatches: typeof matches) => {
    if (!tournamentId) return
    try {
      await axios.post(`/matches`, newMatches, { params: { tournament_id: tournamentId } })
      toast({ title: "Matches saved", description: "All matches have been saved.", variant: "success" })
    } catch (e: any) {
      toast({
        title: "Failed to save matches",
        description: e?.response?.data?.message || e?.message || "Could not save matches.",
        variant: "destructive",
      })
    }
  }

  // Update a single match in backend
  const updateMatch = async (match: typeof matches[0]) => {
    if (!tournamentId) return
    try {
      await axios.patch(`/matches/${match.id}`, match, { params: { tournament_id: tournamentId } })
      toast({ title: "Match updated", description: `Match #${match.id} updated.`, variant: "success" })
    } catch (e: any) {
      toast({
        title: "Failed to update match",
        description: e?.response?.data?.message || e?.message || "Could not update match.",
        variant: "destructive",
      })
    }
  }

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
