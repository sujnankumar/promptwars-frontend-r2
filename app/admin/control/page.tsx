"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TypingText } from "@/components/ui/typing-text"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Progress } from "@/components/ui/progress"
import { Shield, Sword, ArrowLeftRight, Trophy, Check, ArrowRight, Lock } from "lucide-react"
import { ResultModal } from "@/components/result-modal"
import { CountdownTimer } from "@/components/countdown-timer"
import { Badge } from "@/components/ui/badge"
import axios from "@/lib/axios"
import { toast } from "@/hooks/use-toast"

type MatchPhase =
  | "waiting_for_defender"
  | "defender_setup"
  | "attacker_chat"
  | "round_complete"
  | "waiting_for_role_swap"
  | "match_complete"

export default function MatchControl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = searchParams.get("match") ? Number.parseInt(searchParams.get("match") as string) : 2
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [winnerAdvanced, setWinnerAdvanced] = useState(false)
  const [phaseStartTime, setPhaseStartTime] = useState<number | null>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  // Fetch match from backend (with polling)
  const fetchMatch = async () => {
    const tid = typeof window !== "undefined" ? localStorage.getItem("tournamentId") : null
    setTournamentId(tid)
    if (!tid || !matchId) return
    setLoading(true)
    try {
      const res = await axios.get(`/matches/${matchId}`, { params: { tournament_id: tid } })
      setMatch(res.data)
      setPhaseStartTime(res.data.phaseStartTime ? parseFloat(res.data.phaseStartTime) : null)
    } catch (e: any) {
      toast({
        title: "Failed to load match",
        description: e?.response?.data?.message || e?.message || "Could not fetch match from backend.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatch()
    if (pollInterval.current) clearInterval(pollInterval.current)
    pollInterval.current = setInterval(fetchMatch, 3000)
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [matchId])

  // Timer logic: always use backend phaseStartTime
  const isDefenderTimerRunning = match?.currentPhase === "defender_setup" && phaseStartTime !== null
  const isAttackerTimerRunning = match?.currentPhase === "attacker_chat" && phaseStartTime !== null

  // Helper: update phase
  const updatePhase = async (phase: string, currentRound: number) => {
    const tournamentId = typeof window !== "undefined" ? localStorage.getItem("tournamentId") : null
    if (!tournamentId || !matchId) return
    try {
      const res = await axios.patch(`/matches/${matchId}/phase`, { phase, current_round: currentRound }, { params: { tournament_id: tournamentId } })
      setMatch((prev: any) => ({ ...prev, currentPhase: phase, currentRound }))
      // Ensure phaseStartTime is also updated from the response of updatePhase if the backend sends it
      if (res.data.phaseStartTime) {
        setPhaseStartTime(parseFloat(res.data.phaseStartTime));
      }
    } catch (e: any) {
      toast({
        title: "Failed to update phase",
        description: e?.response?.data?.message || e?.message || "Could not update match phase.",
        variant: "destructive",
      })
    }
  }

  // Helper: update results
  const updateResults = async (results: any) => {
    const tournamentId = typeof window !== "undefined" ? localStorage.getItem("tournamentId") : null
    if (!tournamentId || !matchId) return
    try {
      await axios.patch(`/matches/${matchId}/results`, { results }, { params: { tournament_id: tournamentId } })
      setMatch((prev: any) => ({ ...prev, results }))
    } catch (e: any) {
      toast({
        title: "Failed to update results",
        description: e?.response?.data?.message || e?.message || "Could not update match results.",
        variant: "destructive",
      })
    }
  }

  // Helper: finalize match
  const finalizeMatch = async () => {
    const tournamentId = typeof window !== "undefined" ? localStorage.getItem("tournamentId") : null
    if (!tournamentId || !matchId) return
    try {
      const res = await axios.post(`/matches/${matchId}/finalize`, null, { params: { tournament_id: tournamentId } })
      setMatch((prev: any) => ({ ...prev, currentPhase: "match_complete", winner: res.data.winner }))
      setShowResults(true)
    } catch (e: any) {
      toast({
        title: "Failed to finalize match",
        description: e?.response?.data?.message || e?.message || "Could not finalize match.",
        variant: "destructive",
      })
    }
  }

  // UI event handlers (call backend)
  const handleStartRound = () => {
    updatePhase("defender_setup", match.currentRound)
  }
  const handleDefenderTimerComplete = () => {
    updatePhase("attacker_chat", match.currentRound)
  }
  const handleAttackerTimerComplete = () => {
    updatePhase("round_complete", match.currentRound)
  }
  const handleSwapRoles = () => {
    updatePhase("waiting_for_defender", 2)
  }
  const handleFinalizeMatch = () => {
    finalizeMatch()
  }
  const handleAdvanceWinner = () => {
    setWinnerAdvanced(true)
    setTimeout(() => {
      router.push(`/admin/bracket?winner=${match.winner}`)
    }, 1500)
  }

  // Format time helper
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return "Failed"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Get progress percentage based on current phase
  const getProgressPercentage = () => {
    switch (match?.currentPhase) {
      case "waiting_for_defender":
        return match?.currentRound === 1 ? 0 : 50
      case "defender_setup":
        return match?.currentRound === 1 ? 15 : 65
      case "attacker_chat":
        return match?.currentRound === 1 ? 30 : 80
      case "round_complete":
        return match?.currentRound === 1 ? 45 : 95
      case "match_complete":
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neon-green">
          <TypingText text="MATCH CONTROL" speed={50} />
        </h1>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Match #{match?.id}
          </Badge>

          <GlitchButton variant="outline" size="sm" onClick={() => router.push("/admin/matches")} glitchColor="blue">
            <ArrowRight size={16} className="mr-2 rotate-180" />
            Back to Matches
          </GlitchButton>
        </div>
      </div>

      <TerminalCard title="MATCH CONTROL PANEL">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-sm text-muted-foreground">Teams</div>
            <div className="text-xl font-bold">
              {match?.teamA?.name} vs {match?.teamB?.name}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Round</div>
            <div className="text-xl font-bold text-neon-green">{match?.currentRound}/2</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="text-xl font-mono text-yellow-500">
              {match?.currentPhase === "match_complete" ? "COMPLETED" : "IN PROGRESS"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 border rounded-md ${match?.currentRound === 1 ? "border-neon-green" : "border-muted"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold">Round 1</div>
              {match?.currentRound === 1 && match?.currentPhase !== "match_complete" && (
                <Badge variant="outline" className="text-neon-green border-neon-green">
                  Active
                </Badge>
              )}
              {match?.currentRound > 1 && (
                <Badge variant="outline" className="text-muted-foreground">
                  Completed
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Sword size={14} className="text-neon-green" />
                  <span>Attacker:</span>
                </div>
                <span>{match?.results?.round1?.attacker}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-secondary" />
                  <span>Defender:</span>
                </div>
                <span>{match?.results?.round1?.defender}</span>
              </div>

              {match?.currentRound > 1 && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span>Result:</span>
                  {match?.results?.round1?.attackerFoundKey ? (
                    <span className="text-neon-green">
                      Key found in {formatTime(match?.results?.round1?.attackerTime)}
                    </span>
                  ) : (
                    <span className="text-destructive">Key not found</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full h-1 bg-muted">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-muted">
                <ArrowLeftRight
                  size={16}
                  className={match?.currentRound === 2 ? "text-neon-green" : "text-muted-foreground"}
                />
              </div>
            </div>
          </div>

          <div className={`p-4 border rounded-md ${match?.currentRound === 2 ? "border-neon-green" : "border-muted"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold">Round 2</div>
              {match?.currentRound === 2 && match?.currentPhase !== "match_complete" && (
                <Badge variant="outline" className="text-neon-green border-neon-green">
                  Active
                </Badge>
              )}
              {match?.currentRound < 2 && (
                <Badge variant="outline" className="text-muted-foreground">
                  Pending
                </Badge>
              )}
              {match?.currentPhase === "match_complete" && (
                <Badge variant="outline" className="text-muted-foreground">
                  Completed
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Sword size={14} className="text-neon-green" />
                  <span>Attacker:</span>
                </div>
                <span>{match?.results?.round2?.attacker}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-secondary" />
                  <span>Defender:</span>
                </div>
                <span>{match?.results?.round2?.defender}</span>
              </div>

              {match?.currentPhase === "match_complete" && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span>Result:</span>
                  {match?.results?.round2?.attackerFoundKey ? (
                    <span className="text-neon-green">
                      Key found in {formatTime(match?.results?.round2?.attackerTime)}
                    </span>
                  ) : (
                    <span className="text-destructive">Key not found</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Phase Content */}
        {match?.currentPhase === "waiting_for_defender" && (
          <TerminalCard className="mb-6">
            <div className="text-center py-6">
              <div className="inline-block p-4 rounded-full bg-muted/50 mb-4">
                <Shield size={48} className="text-secondary" />
              </div>

              <h3 className="text-xl font-bold mb-2">
                {match?.currentRound === 1 ? "Ready to Start Match" : "Ready for Round 2"}
              </h3>

              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {match?.currentRound === 1
                  ? "Start Round 1 when both teams are ready. The defender will have 3 minutes to set up their defenses."
                  : "Roles have been swapped. Start Round 2 when both teams are ready."}
              </p>

              <GlitchButton onClick={handleStartRound} glitchColor="green">
                {match?.currentRound === 1 ? "Start Round 1" : "Start Round 2"}
              </GlitchButton>
            </div>
          </TerminalCard>
        )}

        {match?.currentPhase === "defender_setup" && (
          <TerminalCard className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield size={16} className="text-secondary" />
                <span>Defender Setup Phase</span>
              </h3>
              <CountdownTimer
                key={phaseStartTime}
                duration={180}
                startTime={phaseStartTime ?? 0}
                onComplete={handleDefenderTimerComplete}
                isRunning={isDefenderTimerRunning}
              />
            </div>
            <p className="text-muted-foreground mb-6">
              The defender is currently setting up their defenses. They have 3 minutes to enter their secret key and
              system prompt.
            </p>
            <div className="flex justify-center">
              <GlitchButton
                variant="outline"
                onClick={handleDefenderTimerComplete}
                glitchColor="blue"
                className="flex items-center gap-2"
              >
                <Lock size={16} />
                <span>Force Lock-In (Skip Timer)</span>
              </GlitchButton>
            </div>
          </TerminalCard>
        )}

        {match?.currentPhase === "attacker_chat" && (
          <TerminalCard className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sword size={16} className="text-neon-green" />
                <span>Attacker Phase</span>
              </h3>
              <CountdownTimer
                key={phaseStartTime}
                duration={300}
                startTime={phaseStartTime ?? 0}
                onComplete={handleAttackerTimerComplete}
                isRunning={isAttackerTimerRunning}
              />
            </div>
            <p className="text-muted-foreground mb-6">
              The attacker is currently trying to extract the secret key. They have 5 minutes to complete their
              attack.
            </p>
            <div className="flex justify-center">
              <GlitchButton
                variant="outline"
                onClick={handleAttackerTimerComplete}
                glitchColor="blue"
                className="flex items-center gap-2"
              >
                <Lock size={16} />
                <span>End Attack Phase (Skip Timer)</span>
              </GlitchButton>
            </div>
          </TerminalCard>
        )}

        {match?.currentPhase === "round_complete" && (
          <TerminalCard className="mb-6 border-neon-green">
            <div className="text-center py-6">
              <div className="inline-block p-4 rounded-full bg-muted/50 text-neon-green mb-4">
                <Check size={48} />
              </div>

              <h3 className="text-xl font-bold mb-2">Round {match?.currentRound} Complete</h3>

              {match?.currentRound === 1 ? (
                <>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Round 1 is complete. The roles will now be swapped for Round 2.
                  </p>

                  <GlitchButton
                    onClick={handleSwapRoles}
                    glitchColor="purple"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <ArrowLeftRight size={16} className="mr-1" />
                    <span>Swap Roles & Start Round 2</span>
                  </GlitchButton>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Both rounds are now complete. You can finalize the match and determine the winner.
                  </p>

                  <GlitchButton onClick={handleFinalizeMatch} glitchColor="green" className="mx-auto">
                    Finalize Match
                  </GlitchButton>
                </>
              )}
            </div>
          </TerminalCard>
        )}

        {match?.currentPhase === "match_complete" && (
          <TerminalCard className="mb-6 border-neon-green glow">
            <div className="text-center py-6">
              <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
              <h3 className="text-2xl font-bold mb-2">Match Complete</h3>
              <p className="text-xl text-neon-green mb-4">Winner: {match?.winner}</p>

              <div className="flex justify-center gap-4 mt-6">
                <GlitchButton onClick={() => setShowResults(true)} variant="outline" glitchColor="blue">
                  View Detailed Results
                </GlitchButton>

                <GlitchButton onClick={handleAdvanceWinner} disabled={winnerAdvanced} glitchColor="green">
                  {winnerAdvanced ? "Winner Advanced" : "Advance Winner in Bracket"}
                </GlitchButton>
              </div>
            </div>
          </TerminalCard>
        )}

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Match Progress</h3>
            <div className="text-sm text-muted-foreground">
              {match?.currentPhase === "match_complete"
                ? "Complete"
                : `Round ${match?.currentRound} - ${match?.currentPhase?.replace(/_/g, " ")}`}
            </div>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </TerminalCard>

      {/* Result Modal */}
      <ResultModal isOpen={showResults} onClose={() => setShowResults(false)} results={match?.results} />
    </div>
  )
}
