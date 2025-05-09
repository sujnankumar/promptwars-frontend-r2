"use client"

import { useState, useEffect, useRef } from "react"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TypingText } from "@/components/ui/typing-text"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Users, Trophy, Plus } from "lucide-react"
import { TeamSetupModal } from "@/components/team-setup-modal"
import { TournamentSetupModal } from "@/components/tournament-setup-modal"
import { MatchCard } from "@/components/match-card"
import { BracketConnector } from "@/components/bracket-connector"
import { useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import axios from "@/lib/axios"

type MatchStatus = "pending" | "in-progress" | "completed"

interface Team {
  id: number
  name: string
}

interface Match {
  id: number
  team1: Team | null
  team2: Team | null
  winner: Team | null
  status: MatchStatus
  round: "quarterfinal" | "semifinal" | "final"
}

export default function TournamentBracket() {
  const searchParams = useSearchParams()
  const advancedWinner = searchParams.get("winner")
  const bracketRef = useRef<HTMLDivElement>(null)

  const [showTeamSetup, setShowTeamSetup] = useState(false)
  const [showTournamentSetup, setShowTournamentSetup] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [connectors, setConnectors] = useState<
    { id: string; startX: number; startY: number; endX: number; endY: number }[]
  >([])
  const [animateConnectors, setAnimateConnectors] = useState(false)
  const [teamsRegistered, setTeamsRegistered] = useState(false)
  const [registeringTeams, setRegisteringTeams] = useState(false)
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [tournamentSetupComplete, setTournamentSetupComplete] = useState(false)

  // Initial bracket structure
  const [bracket, setBracket] = useState<{
    quarterfinals: Match[]
    semifinals: Match[]
    final: Match[]
  }>({
    quarterfinals: [
      { id: 1, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
      { id: 2, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
      { id: 3, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
      { id: 4, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
    ],
    semifinals: [
      { id: 5, team1: null, team2: null, winner: null, status: "pending", round: "semifinal" },
      { id: 6, team1: null, team2: null, winner: null, status: "pending", round: "semifinal" },
    ],
    final: [{ id: 7, team1: null, team2: null, winner: null, status: "pending", round: "final" }],
  })

  // Helper: Sync a round's matchups to backend (for new backend contract)
  const syncRoundToBackend = async (round: "quarterfinal" | "semifinal" | "final", bracketToSync: typeof bracket, tid: string | null) => {
    if (!tid) return
    try {
      let matchups: Team[][] = []
      if (round === "quarterfinal") {
        matchups = bracketToSync.quarterfinals.map(m => [m.team1, m.team2].filter(Boolean) as Team[])
      } else if (round === "semifinal") {
        matchups = bracketToSync.semifinals.map(m => [m.team1, m.team2].filter(Boolean) as Team[])
      } else if (round === "final") {
        matchups = bracketToSync.final.map(m => [m.team1, m.team2].filter(Boolean) as Team[])
      }
      await axios.post("/tournament/matchups", {
        tournament_id: tid,
        round,
        matchups,
      })
      toast({
        title: `Bracket synced (${round})`,
        description: `Bracket state for ${round} saved to backend`,
        variant: "success",
      })
    } catch (e: any) {
      toast({
        title: "Error syncing bracket",
        description: e?.response?.data?.message || e?.message || "Could not sync bracket to backend.",
        variant: "destructive",
      })
    }
  }

  // Restore teams and tournamentId from localStorage on mount
  useEffect(() => {
    const storedTournamentId = typeof window !== "undefined" ? localStorage.getItem("tournamentId") : null
    if (storedTournamentId) {
      setTournamentId(storedTournamentId)
      axios
        .get("/auth/teams", { params: { tournament_id: storedTournamentId } })
        .then((res) => {
          if (res.data.success && Array.isArray(res.data.teams) && res.data.teams.length === 8) {
            setTeams(res.data.teams.map((t: any, idx: number) => ({ id: Number(t.id) || idx + 1, name: t.username || t.name })))
            setTeamsRegistered(true)
            // Optionally, update bracket with teams
            const confirmedTeams = res.data.teams.map((t: any, idx: number) => ({ id: Number(t.id) || idx + 1, name: t.username || t.name }))
            const updatedBracket = { ...bracket }
            for (let i = 0; i < 4; i++) {
              updatedBracket.quarterfinals[i].team1 = confirmedTeams[i * 2] || null
              updatedBracket.quarterfinals[i].team2 = confirmedTeams[i * 2 + 1] || null
            }
            setBracket(updatedBracket)
            if (typeof window !== "undefined") {
              localStorage.setItem("tournamentId", storedTournamentId)
            }
          }
        })
        .catch(() => {
          setTeamsRegistered(false)
          setTeams([])
        })
    }
  }, [])

  // Restore matchups from backend on mount if tournamentId exists
  useEffect(() => {
    if (!tournamentId) return
    const fetchAllRounds = async () => {
      const updatedBracket = { ...bracket }
      for (const round of ["quarterfinal", "semifinal", "final"] as const) {
        try {
          const res = await axios.get("/tournament/matchups", { params: { tournament_id: tournamentId, round } })
          if (res.data && Array.isArray(res.data.matchups)) {
            const matchups: Team[][] = res.data.matchups
            if (round === "quarterfinal") {
              for (let i = 0; i < 4; i++) {
                updatedBracket.quarterfinals[i].team1 = matchups[i]?.[0] ?? null
                updatedBracket.quarterfinals[i].team2 = matchups[i]?.[1] ?? null
              }
            } else if (round === "semifinal") {
              for (let i = 0; i < 2; i++) {
                updatedBracket.semifinals[i].team1 = matchups[i]?.[0] ?? null
                updatedBracket.semifinals[i].team2 = matchups[i]?.[1] ?? null
              }
            } else if (round === "final") {
              updatedBracket.final[0].team1 = matchups[0]?.[0] ?? null
              updatedBracket.final[0].team2 = matchups[0]?.[1] ?? null
            }
          }
        } catch {}
      }
      setBracket(updatedBracket)
    }
    fetchAllRounds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  // Check for advanced winner from match control
  useEffect(() => {
    if (advancedWinner && teams.length > 0) {
      // For demo purposes, advance Team Epsilon if it came from match control
      if (advancedWinner === "auto") {
        const updatedBracket = { ...bracket }
        const winnerTeam = teams.find((team) => team.name === "Team Epsilon")

        if (winnerTeam) {
          // Find the match with Team Epsilon
          const matchIndex = updatedBracket.quarterfinals.findIndex(
            (match) => match.team1?.id === winnerTeam.id || match.team2?.id === winnerTeam.id,
          )

          if (matchIndex !== -1) {
            // Set the winner
            updatedBracket.quarterfinals[matchIndex].winner = winnerTeam
            updatedBracket.quarterfinals[matchIndex].status = "completed"

            // Propagate to semifinals
            const semifinalIndex = Math.floor(matchIndex / 2)
            const isFirstTeam = matchIndex % 2 === 0

            if (isFirstTeam) {
              updatedBracket.semifinals[semifinalIndex].team1 = winnerTeam
            } else {
              updatedBracket.semifinals[semifinalIndex].team2 = winnerTeam
            }

            setBracket(updatedBracket)
          }
        }
      }
    }
  }, [advancedWinner, teams])

  // Calculate connector positions when bracket changes or on window resize
  useEffect(() => {
    const calculateConnectors = () => {
      if (!bracketRef.current) return

      const newConnectors: { id: string; startX: number; startY: number; endX: number; endY: number }[] = []

      // Get all match cards
      const matchCards = bracketRef.current.querySelectorAll("[data-match-card]")
      const matchCardsArray = Array.from(matchCards)

      // Connect quarterfinals to semifinals
      for (let i = 0; i < 4; i += 2) {
        const qfCard = matchCardsArray.find((el) => el.getAttribute("data-match-id") === `qf-${i + 1}`)
        const qfNextCard = matchCardsArray.find((el) => el.getAttribute("data-match-id") === `qf-${i + 2}`)
        const sfCard = matchCardsArray.find((el) => el.getAttribute("data-match-id") === `sf-${Math.floor(i / 2) + 1}`)

        if (qfCard && sfCard) {
          const qfRect = qfCard.getBoundingClientRect()
          const sfRect = sfCard.getBoundingClientRect()
          const bracketRect = bracketRef.current.getBoundingClientRect()

          newConnectors.push({
            id: `qf-${i + 1}-to-sf-${Math.floor(i / 2) + 1}`,
            startX: qfRect.right - bracketRect.left,
            startY: qfRect.top + qfRect.height / 2 - bracketRect.top,
            endX: sfRect.left - bracketRect.left,
            endY: sfRect.top + sfRect.height / 3 - bracketRect.top,
          })
        }

        if (qfNextCard && sfCard) {
          const qfRect = qfNextCard.getBoundingClientRect()
          const sfRect = sfCard.getBoundingClientRect()
          const bracketRect = bracketRef.current.getBoundingClientRect()

          newConnectors.push({
            id: `qf-${i + 2}-to-sf-${Math.floor(i / 2) + 1}`,
            startX: qfRect.right - bracketRect.left,
            startY: qfRect.top + qfRect.height / 2 - bracketRect.top,
            endX: sfRect.left - bracketRect.left,
            endY: sfRect.top + (sfRect.height * 2) / 3 - bracketRect.top,
          })
        }
      }

      // Connect semifinals to final
      for (let i = 0; i < 2; i++) {
        const sfCard = matchCardsArray.find((el) => el.getAttribute("data-match-id") === `sf-${i + 1}`)
        const finalCard = matchCardsArray.find((el) => el.getAttribute("data-match-id") === `f-1`)

        if (sfCard && finalCard) {
          const sfRect = sfCard.getBoundingClientRect()
          const finalRect = finalCard.getBoundingClientRect()
          const bracketRect = bracketRef.current.getBoundingClientRect()

          newConnectors.push({
            id: `sf-${i + 1}-to-f-1`,
            startX: sfRect.right - bracketRect.left,
            startY: sfRect.top + sfRect.height / 2 - bracketRect.top,
            endX: finalRect.left - bracketRect.left,
            endY: finalRect.top + (i === 0 ? finalRect.height / 3 : (finalRect.height * 2) / 3) - bracketRect.top,
          })
        }
      }

      setConnectors(newConnectors)
    }

    // Calculate on mount and when bracket changes
    calculateConnectors()

    // Recalculate on window resize
    window.addEventListener("resize", calculateConnectors)
    return () => window.removeEventListener("resize", calculateConnectors)
  }, [bracket, teams])

  const handleTeamsConfirmed = async (confirmedTeams: Team[]) => {
    setRegisteringTeams(true)
    try {
      const response = await axios.post("/auth/register-teams-bulk", {
        team_names: confirmedTeams.map((t) => t.name),
      })
      const data = response.data
      if (data.success) {
        setTeams(confirmedTeams)
        setTeamsRegistered(true)
        setTournamentId(data.tournament_id)
        if (typeof window !== "undefined") {
          localStorage.setItem("tournamentId", data.tournament_id)
        }
        // Update bracket with teams
        const updatedBracket = { ...bracket }
        for (let i = 0; i < 4; i++) {
          updatedBracket.quarterfinals[i].team1 = confirmedTeams[i * 2] || null
          updatedBracket.quarterfinals[i].team2 = confirmedTeams[i * 2 + 1] || null
        }
        setBracket(updatedBracket)
        setTimeout(() => {
          setAnimateConnectors(true)
        }, 500)
        toast({
          title: "Teams registered!",
          description: data.message || "All teams have been registered successfully.",
          variant: "success",
        })
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Could not register teams.",
          variant: "destructive",
        })
      }
    } catch (e: any) {
      toast({
        title: "Error registering teams",
        description: e?.response?.data?.message || e?.message || "An unexpected error occurred.",
        variant: "destructive",
      })
      console.error("Failed to register teams", e)
    } finally {
      setRegisteringTeams(false)
    }
  }

  const handleWinnerSelection = async (
    roundType: "quarterfinals" | "semifinals" | "final",
    matchId: number,
    winnerId: number,
  ) => {
    const updatedBracket = { ...bracket }

    // Update the winner for the current match
    const currentRound = updatedBracket[roundType]
    const matchIndex = currentRound.findIndex((match) => match.id === matchId)

    if (matchIndex === -1) return

    const match = currentRound[matchIndex]
    const winner = match.team1?.id === winnerId ? match.team1 : match.team2

    if (!winner) return

    updatedBracket[roundType][matchIndex].winner = winner
    updatedBracket[roundType][matchIndex].status = "completed"

    // Propagate the winner to the next round
    if (roundType === "quarterfinals") {
      const semifinalIndex = Math.floor(matchIndex / 2)
      const isFirstTeam = matchIndex % 2 === 0

      if (isFirstTeam) {
        updatedBracket.semifinals[semifinalIndex].team1 = winner
      } else {
        updatedBracket.semifinals[semifinalIndex].team2 = winner
      }

      // If both teams are set, update status to pending
      const semifinal = updatedBracket.semifinals[semifinalIndex]
      if (semifinal.team1 && semifinal.team2) {
        semifinal.status = "pending"
      }
      await syncRoundToBackend("semifinal", updatedBracket, tournamentId)
    } else if (roundType === "semifinals") {
      const isFirstTeam = matchIndex === 0

      if (isFirstTeam) {
        updatedBracket.final[0].team1 = winner
      } else {
        updatedBracket.final[0].team2 = winner
      }

      // If both teams are set, update status to pending
      const final = updatedBracket.final[0]
      if (final.team1 && final.team2) {
        final.status = "pending"
      }
      await syncRoundToBackend("final", updatedBracket, tournamentId)
    }

    setBracket(updatedBracket)
  }

  // For demo purposes, let's add a function to set a match as "in progress"
  const setMatchInProgress = (roundType: "quarterfinals" | "semifinals" | "final", matchId: number) => {
    const updatedBracket = { ...bracket }
    const currentRound = updatedBracket[roundType]
    const matchIndex = currentRound.findIndex((match) => match.id === matchId)

    if (matchIndex === -1) return

    updatedBracket[roundType][matchIndex].status = "in-progress"
    setBracket(updatedBracket)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neon-green">
          <TypingText text="TOURNAMENT BRACKET" speed={50} />
        </h1>

        <div className="flex gap-4">
          <GlitchButton
            onClick={() => setShowTeamSetup(true)}
            glitchColor="green"
            className="flex items-center gap-2"
            disabled={teamsRegistered || registeringTeams}
          >
            <Users size={16} />
            <span>Setup Teams</span>
          </GlitchButton>
          <GlitchButton
            onClick={() => setShowTournamentSetup(true)}
            glitchColor="blue"
            className="flex items-center gap-2"
            disabled={!teamsRegistered || teams.length !== 8 || tournamentSetupComplete}
          >
            <Trophy size={16} />
            <span>Setup Tournament</span>
          </GlitchButton>
        </div>
      </div>

      <TerminalCard title="TOURNAMENT BRACKET">
        <div className="relative min-h-[600px]" ref={bracketRef}>
          <div className="grid grid-cols-3 gap-6 relative">
            {/* Quarterfinals */}
            <div className="space-y-6">
              <h3 className="text-center mb-4 text-secondary font-bold">QUARTER-FINALS</h3>
              <div className="space-y-6">
                {bracket.quarterfinals.map((match) => (
                  <div key={match.id} data-match-card data-match-id={`qf-${match.id}`}>
                    <MatchCard
                      matchId={match.id}
                      teamA={match.team1}
                      teamB={match.team2}
                      winner={match.winner}
                      status={match.status}
                      round="quarterfinal"
                      onSelectWinner={(winnerId) => handleWinnerSelection("quarterfinals", match.id, winnerId)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Semifinals */}
            <div className="space-y-6">
              <h3 className="text-center mb-4 text-accent font-bold">SEMI-FINALS</h3>
              <div className="space-y-24 pt-12">
                {bracket.semifinals.map((match) => (
                  <div key={match.id} data-match-card data-match-id={`sf-${match.id}`}>
                    <MatchCard
                      matchId={match.id}
                      teamA={match.team1}
                      teamB={match.team2}
                      winner={match.winner}
                      status={match.status}
                      round="semifinal"
                      onSelectWinner={(winnerId) => handleWinnerSelection("semifinals", match.id, winnerId)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Final */}
            <div className="space-y-6">
              <h3 className="text-center mb-4 text-neon-green font-bold">FINAL</h3>
              <div className="pt-36" data-match-card data-match-id="f-1">
                <MatchCard
                  matchId={1}
                  teamA={bracket.final[0].team1}
                  teamB={bracket.final[0].team2}
                  winner={bracket.final[0].winner}
                  status={bracket.final[0].status}
                  round="final"
                  onSelectWinner={(winnerId) => handleWinnerSelection("final", 7, winnerId)}
                  className="border-2"
                />

                {bracket.final[0].winner && (
                  <div className="mt-6 p-4 border-2 border-neon-green rounded-md text-center glow">
                    <Trophy size={32} className="mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm text-muted-foreground mb-1">TOURNAMENT CHAMPION</div>
                    <div className="text-2xl font-bold text-neon-green">{bracket.final[0].winner.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Connectors */}
            {connectors.map((connector) => (
              <BracketConnector
                key={connector.id}
                startX={connector.startX}
                startY={connector.startY}
                endX={connector.endX}
                endY={connector.endY}
                color="#00ff00"
                animated={animateConnectors}
              />
            ))}
          </div>
        </div>
      </TerminalCard>

      <div className="flex justify-end">
        <GlitchButton
          variant="outline"
          onClick={async () => {
            if (!tournamentId) {
              toast({
                title: "No tournament to reset",
                description: "No tournament ID found. Please set up teams first.",
                variant: "destructive",
              })
              return
            }
            try {
              const response = await axios.post("/auth/reset-tournament", null, {
                params: { tournament_id: tournamentId },
              })
              const data = response.data
              if (data.success) {
                setBracket({
                  quarterfinals: [
                    { id: 1, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
                    { id: 2, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
                    { id: 3, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
                    { id: 4, team1: null, team2: null, winner: null, status: "pending", round: "quarterfinal" },
                  ],
                  semifinals: [
                    { id: 5, team1: null, team2: null, winner: null, status: "pending", round: "semifinal" },
                    { id: 6, team1: null, team2: null, winner: null, status: "pending", round: "semifinal" },
                  ],
                  final: [{ id: 7, team1: null, team2: null, winner: null, status: "pending", round: "final" }],
                })
                setTeams([])
                setAnimateConnectors(false)
                setTeamsRegistered(false)
                setTournamentId(null)
                setTournamentSetupComplete(false)
                if (typeof window !== "undefined") {
                  localStorage.removeItem("tournamentId")
                }
                toast({
                  title: "Bracket reset",
                  description: data.message || "The tournament bracket and teams have been reset.",
                  variant: "success",
                })
              } else {
                toast({
                  title: "Reset failed",
                  description: data.message || "Could not reset tournament.",
                  variant: "destructive",
                })
              }
            } catch (e: any) {
              toast({
                title: "Error resetting tournament",
                description: e?.response?.data?.message || e?.message || "An unexpected error occurred.",
                variant: "destructive",
              })
              console.error("Failed to reset tournament", e)
            }
          }}
          glitchColor="purple"
        >
          Reset Bracket
        </GlitchButton>
      </div>

      {/* Team Setup Modal */}
      <TeamSetupModal
        isOpen={showTeamSetup}
        onClose={() => setShowTeamSetup(false)}
        onTeamsConfirmed={handleTeamsConfirmed}
      />
      {/* Tournament Setup Modal */}
      <TournamentSetupModal
        isOpen={showTournamentSetup}
        onClose={() => setShowTournamentSetup(false)}
        teams={teams}
        onSetup={async (matchups) => {
          if (!tournamentId) {
            toast({
              title: "No tournament ID",
              description: "Please register teams before setting up the tournament.",
              variant: "destructive",
            })
            return
          }
          try {
            const updatedBracket = { ...bracket }
            for (let i = 0; i < 4; i++) {
              updatedBracket.quarterfinals[i].team1 = matchups[i][0]
              updatedBracket.quarterfinals[i].team2 = matchups[i][1]
              updatedBracket.quarterfinals[i].winner = null
              updatedBracket.quarterfinals[i].status = "pending"
            }
            // Clear later rounds
            for (let i = 0; i < 2; i++) {
              updatedBracket.semifinals[i].team1 = null
              updatedBracket.semifinals[i].team2 = null
              updatedBracket.semifinals[i].winner = null
              updatedBracket.semifinals[i].status = "pending"
            }
            updatedBracket.final[0].team1 = null
            updatedBracket.final[0].team2 = null
            updatedBracket.final[0].winner = null
            updatedBracket.final[0].status = "pending"
            setBracket(updatedBracket)
            setShowTournamentSetup(false)
            setTournamentSetupComplete(true)
            // Save only quarterfinals to backend for setup
            await syncRoundToBackend("quarterfinal", updatedBracket, tournamentId)
          } catch (e: any) {
            toast({
              title: "Error setting up tournament",
              description: e?.response?.data?.message || e?.message || "An unexpected error occurred.",
              variant: "destructive",
            })
          }
        }}
      />
    </div>
  )
}
