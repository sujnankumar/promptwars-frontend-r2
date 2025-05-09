"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TypingText } from "@/components/ui/typing-text"
import { GlitchButton } from "@/components/ui/glitch-button"
import { TerminalInput } from "@/components/ui/terminal-input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { Shield, Sword, LogOut, Lock, AlertTriangle, Trophy } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import { CountdownTimer } from "@/components/countdown-timer"
import { ResultModal } from "@/components/result-modal"
import axios from "@/lib/axios"
import { toast } from "@/hooks/use-toast"

// Match phases
type MatchPhase =
  | "waiting_for_defender"
  | "defender_setup"
  | "attacker_chat"
  | "round_complete"
  | "waiting_for_role_swap"
  | "match_complete"

export default function TeamArena() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<"attacker" | "defender">("attacker")
  const [opponent, setOpponent] = useState("")
  const [currentRound, setCurrentRound] = useState(1)
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("waiting_for_defender")
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<number | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [phaseStartTime, setPhaseStartTime] = useState<number | null>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  // Defender state
  const [secretKey, setSecretKey] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isDefenderLocked, setIsDefenderLocked] = useState(false)

  // Attacker state
  const [attackerFoundKey, setAttackerFoundKey] = useState(false)
  const [attackerTime, setAttackerTime] = useState<number | undefined>(undefined)

  // Results state
  const [matchResults, setMatchResults] = useState({
    teamA: {
      name: user?.teamName || "Your Team",
      time: undefined as number | undefined,
      systemPromptLength: undefined as number | undefined,
    },
    teamB: {
      name: opponent,
      time: undefined as number | undefined,
      systemPromptLength: undefined as number | undefined,
    },
    winner: "",
  })
  const [showResults, setShowResults] = useState(false)

  // Helper: fetch match for this team
  const fetchMatch = async () => {
    const tid = user?.tournamentId
    if (!tid || !user?.teamName) return
    setLoading(true)
    try {
      const res = await axios.get(`/matches`, { params: { tournament_id: tid } })
      const matches = res.data || []
      const foundMatch = matches.find(
        (m: any) => m.teamA?.name === user.teamName || m.teamB?.name === user.teamName
      )
      if (!foundMatch) {
        toast({
          title: "No match assigned",
          description: "Your team is not assigned to any match in this tournament.",
          variant: "destructive",
        })
        setMatch(null)
        setMatchId(null)
        setOpponent("")
        setRole("attacker")
        setMatchPhase("waiting_for_defender")
        setCurrentRound(1)
        setPhaseStartTime(null)
        setLoading(false)
        return
      }
      setMatch(foundMatch)
      setMatchId(foundMatch.id)
      setCurrentRound(foundMatch.currentRound)
      setMatchPhase(foundMatch.currentPhase)
      setPhaseStartTime(foundMatch.phaseStartTime || null)
      if (foundMatch.teamA?.name === user.teamName) {
        setRole("attacker")
        setOpponent(foundMatch.teamB?.name || "")
      } else {
        setRole("defender")
        setOpponent(foundMatch.teamA?.name || "")
      }
    } catch (e: any) {
      toast({
        title: "Failed to load matches",
        description: e?.response?.data?.message || e?.message || "Could not fetch matches from backend.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Poll for match state every 3 seconds
  useEffect(() => {
    fetchMatch()
    if (pollInterval.current) clearInterval(pollInterval.current)
    pollInterval.current = setInterval(fetchMatch, 3000)
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [user])

  // Timer logic: always use backend phaseStartTime
  const isDefenderTimerRunning = matchPhase === "defender_setup"
  const isAttackerTimerRunning = matchPhase === "attacker_chat"

  // Helper: update phase
  const updatePhase = async (phase: string, round: number) => {
    const tournamentId = user?.tournamentId
    if (!tournamentId || !matchId) return
    try {
      const res = await axios.patch(
        `/matches/${matchId}/phase`,
        { phase, current_round: round },
        { params: { tournament_id: tournamentId } },
      )
      setMatchPhase(phase as MatchPhase)
      setCurrentRound(round)
      setMatch((prev: any) => ({ ...prev, currentPhase: phase, currentRound: round }))
      setPhaseStartTime(res.data.phaseStartTime || null)
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
    const tournamentId = user?.tournamentId
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
    const tournamentId = user?.tournamentId
    if (!tournamentId || !matchId) return
    try {
      const res = await axios.post(`/matches/${matchId}/finalize`, null, { params: { tournament_id: tournamentId } })
      setMatchPhase("match_complete")
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

  // Helper: get opponent system prompt and secret key from match if available
  const getOpponentSystemPrompt = () => {
    if (role === "attacker" && match?.teamB?.name === opponent) {
      return match?.teamB?.systemPrompt || ""
    }
    return ""
  }
  const getOpponentSecretKey = () => {
    if (role === "attacker" && match?.teamB?.name === opponent) {
      return match?.teamB?.secretKey || ""
    }
    return ""
  }

  // All event handlers now call backend
  const handleStartRound = () => {
    updatePhase("defender_setup", currentRound)
  }
  const handleDefenderLockIn = () => {
    if (!secretKey.trim() || !systemPrompt.trim()) return
    setIsDefenderLocked(true)
    updatePhase("attacker_chat", currentRound)
  }
  const handleRoleSwap = () => {
    setRole(role === "attacker" ? "defender" : "attacker")
    updatePhase("waiting_for_defender", 2)
    setSecretKey("")
    setSystemPrompt("")
    setIsDefenderLocked(false)
    setAttackerFoundKey(false)
    setAttackerTime(undefined)
  }
  const handleKeyFound = (timestamp: number) => {
    const timeInSeconds = Math.floor((timestamp - Date.now() + 300000) / 1000)
    setAttackerFoundKey(true)
    setAttackerTime(timeInSeconds)
    let newResults = match?.results || {}
    if (currentRound === 1) {
      if (role === "defender") {
        newResults.round1 = {
          ...newResults.round1,
          attacker: opponent,
          defender: user?.teamName,
          attackerFoundKey: true,
          attackerTime: timeInSeconds,
          defenderPromptLength: systemPrompt.length,
          secretKey,
        }
      } else {
        newResults.round1 = {
          ...newResults.round1,
          attacker: user?.teamName,
          defender: opponent,
          attackerFoundKey: true,
          attackerTime: timeInSeconds,
          defenderPromptLength: getOpponentSystemPrompt().length,
          secretKey: getOpponentSecretKey(),
        }
      }
    } else {
      if (role === "attacker") {
        newResults.round2 = {
          ...newResults.round2,
          attacker: user?.teamName,
          defender: opponent,
          attackerFoundKey: true,
          attackerTime: timeInSeconds,
          defenderPromptLength: secretKey.length,
          secretKey,
        }
      } else {
        newResults.round2 = {
          ...newResults.round2,
          attacker: opponent,
          defender: user?.teamName,
          attackerFoundKey: true,
          attackerTime: timeInSeconds,
          defenderPromptLength: systemPrompt.length,
          secretKey,
        }
      }
    }
    updateResults(newResults)
  }

  // Get status text based on match phase and role
  const getStatusText = () => {
    switch (matchPhase) {
      case "waiting_for_defender":
        return role === "defender"
          ? "You are the defender. Start the round when ready."
          : "Waiting for defender to start the round..."
      case "defender_setup":
        return role === "defender"
          ? "Set up your defenses and lock in when ready."
          : "Defender is setting up defenses..."
      case "attacker_chat":
        return role === "attacker"
          ? "You are the attacker. Try to extract the secret key."
          : "Attacker is attempting to extract your secret key..."
      case "round_complete":
        return currentRound === 1
          ? "Round 1 complete. Preparing for role swap..."
          : "Match complete. Calculating results..."
      case "waiting_for_role_swap":
        return "Roles have been swapped. Waiting for Round 2 to begin..."
      case "match_complete":
        return "Match complete. View the results."
      default:
        return "Unknown status"
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon-green">
              <TypingText text="PROMPT WARS ARENA" speed={50} />
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.teamName || "Your Team"} vs {opponent}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Round {currentRound}/2</div>

            <GlitchButton variant="outline" size="sm" onClick={logout} glitchColor="purple">
              <LogOut size={16} className="mr-2" />
              Logout
            </GlitchButton>
          </div>
        </div>

        <TerminalCard title="MATCH STATUS">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${role === "attacker" ? "bg-neon-green/20" : "bg-secondary/20"}`}>
                {role === "attacker" ? (
                  <Sword size={24} className="text-neon-green" />
                ) : (
                  <Shield size={24} className="text-secondary" />
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Your Role</div>
                <div className={`text-xl font-bold ${role === "attacker" ? "text-neon-green" : "text-secondary"}`}>
                  {role === "attacker" ? "ATTACKER" : "DEFENDER"}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-xl font-bold text-accent">{getStatusText()}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-muted-foreground">Opponent</div>
              <div className="text-xl font-bold text-accent">{opponent}</div>
            </div>
          </div>
        </TerminalCard>

        {/* Defender View */}
        {role === "defender" && (
          <TerminalCard title="DEFENDER CONSOLE">
            {matchPhase === "waiting_for_defender" && (
              <div className="text-center py-8">
                <div className="inline-block p-4 rounded-full bg-muted/50 text-secondary mb-4">
                  <Shield size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4">You are the Defender</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  As the defender, your goal is to protect your secret key from being extracted by the attacker.
                </p>

                <GlitchButton onClick={handleStartRound} glitchColor="purple" className="mx-auto">
                  Start Round
                </GlitchButton>
              </div>
            )}

            {matchPhase === "defender_setup" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Shield size={16} className="text-secondary" />
                    <span>Defense Setup</span>
                  </h3>

                  <CountdownTimer
                    key={phaseStartTime}
                    duration={180}
                    startTime={phaseStartTime ?? 0}
                    onComplete={() => {}}
                    isRunning={isDefenderTimerRunning}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Secret Key</label>
                    <TerminalInput
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter your secret key..."
                      disabled={isDefenderLocked}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the key the attacker will try to extract. Make it challenging!
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">System Prompt</label>
                    <Textarea
                      placeholder="Enter your system prompt to protect the key..."
                      className="h-32 font-mono"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      disabled={isDefenderLocked}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This prompt will be used to instruct the AI to protect your key.
                    </p>
                  </div>
                </div>

                {!isDefenderLocked ? (
                  <GlitchButton
                    onClick={handleDefenderLockIn}
                    disabled={!secretKey.trim() || !systemPrompt.trim()}
                    className="w-full"
                    glitchColor="purple"
                  >
                    <Lock size={16} className="mr-2" />
                    Lock In Defense
                  </GlitchButton>
                ) : (
                  <div className="p-4 border border-secondary rounded-md bg-secondary/10 text-center">
                    <h4 className="font-bold text-secondary mb-2 flex items-center justify-center gap-2">
                      <Lock size={16} />
                      <span>Defense Locked In</span>
                    </h4>
                    <p className="text-muted-foreground">
                      Your defense has been locked in. The attacker is now attempting to extract your secret key.
                    </p>
                  </div>
                )}
              </div>
            )}

            {matchPhase === "attacker_chat" && (
              <div className="text-center py-8">
                <div className="inline-block p-4 rounded-full bg-muted/50 text-secondary mb-4">
                  <Shield size={48} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-2">Attacker is Active</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The attacker is currently trying to extract your secret key. Your defenses are being tested.
                </p>

                <div className="mt-6 max-w-md mx-auto">
                  <CountdownTimer
                    key={phaseStartTime}
                    duration={300}
                    startTime={phaseStartTime ?? 0}
                    onComplete={() => {}}
                    isRunning={isAttackerTimerRunning}
                  />
                </div>
              </div>
            )}

            {matchPhase === "round_complete" && (
              <div className="text-center py-8">
                <div className="inline-block p-4 rounded-full bg-muted/50 text-neon-green mb-4">
                  {attackerFoundKey ? (
                    <AlertTriangle size={48} className="text-destructive" />
                  ) : (
                    <Shield size={48} className="text-secondary" />
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2">Round {currentRound} Complete</h3>

                {attackerFoundKey ? (
                  <div>
                    <p className="text-destructive font-bold mb-2">
                      Attacker found your secret key in {formatTime(attackerTime)}!
                    </p>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your defenses were breached. The attacker successfully extracted your secret key.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-secondary font-bold mb-2">Your defenses held strong!</p>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      The attacker failed to extract your secret key within the time limit.
                    </p>
                  </div>
                )}

                {currentRound === 1 && (
                  <GlitchButton onClick={handleRoleSwap} className="mt-6" glitchColor="blue">
                    Swap Roles & Start Round 2
                  </GlitchButton>
                )}
              </div>
            )}
          </TerminalCard>
        )}

        {/* Attacker View */}
        {role === "attacker" && (
          <TerminalCard title="ATTACKER CONSOLE">
            {(matchPhase === "waiting_for_defender" || matchPhase === "defender_setup") && (
              <div className="text-center py-8">
                <div className="inline-block p-4 rounded-full bg-muted/50 text-neon-green mb-4">
                  <Sword size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4">You are the Attacker</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  As the attacker, your goal is to extract the secret key from the AI. Waiting for the defender to set
                  up their defenses...
                </p>
              </div>
            )}

            {matchPhase === "attacker_chat" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sword size={16} className="text-neon-green" />
                    <span>Attack Console</span>
                  </h3>

                  <CountdownTimer
                    key={phaseStartTime}
                    duration={300}
                    startTime={phaseStartTime ?? 0}
                    onComplete={() => {}}
                    isRunning={isAttackerTimerRunning}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Try to extract the secret key from the AI. Use clever prompts to trick it into revealing the key.
                </p>

                <ChatInterface
                  onSubmit={() => {}}
                  onKeyFound={handleKeyFound}
                  secretKey={
                    currentRound === 1
                      ? role === "attacker"
                        ? match?.teamB?.secretKey
                        : match?.teamA?.secretKey
                      : role === "attacker"
                      ? match?.teamA?.secretKey
                      : match?.teamB?.secretKey
                  }
                  isDisabled={!isAttackerTimerRunning}
                  className="h-[400px]"
                />
              </div>
            )}

            {matchPhase === "round_complete" && (
              <div className="text-center py-8">
                <div className="inline-block p-4 rounded-full bg-muted/50 text-neon-green mb-4">
                  {attackerFoundKey ? (
                    <Sword size={48} className="text-neon-green" />
                  ) : (
                    <AlertTriangle size={48} className="text-destructive" />
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2">Round {currentRound} Complete</h3>

                {attackerFoundKey ? (
                  <div>
                    <p className="text-neon-green font-bold mb-2">
                      You found the secret key in {formatTime(attackerTime)}!
                    </p>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your attack was successful. You extracted the secret key from the AI.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-destructive font-bold mb-2">Time's up! Secret key not found.</p>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your attack was unsuccessful. You failed to extract the secret key within the time limit.
                    </p>
                  </div>
                )}

                {currentRound === 1 && (
                  <GlitchButton onClick={handleRoleSwap} className="mt-6" glitchColor="blue">
                    Swap Roles & Start Round 2
                  </GlitchButton>
                )}
              </div>
            )}
          </TerminalCard>
        )}

        {matchPhase === "match_complete" && (
          <TerminalCard title="MATCH COMPLETE" className="border-neon-green">
            <div className="text-center py-8">
              <div className="inline-block p-4 rounded-full bg-muted/50 text-yellow-500 mb-4">
                <Trophy size={48} />
              </div>

              <h3 className="text-xl font-bold mb-2">Match Complete</h3>

              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Both rounds have been completed. The results are being calculated.
              </p>

              <GlitchButton onClick={() => setShowResults(true)} glitchColor="green">
                View Results
              </GlitchButton>
            </div>
          </TerminalCard>
        )}
      </div>

      {/* Result Modal */}
      <ResultModal isOpen={showResults} onClose={() => setShowResults(false)} results={matchResults} />
    </div>
  )
}

// Helper function to format time
function formatTime(seconds?: number) {
  if (seconds === undefined) return "00:00"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
