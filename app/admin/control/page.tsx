"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TypingText } from "@/components/ui/typing-text"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Progress } from "@/components/ui/progress"
import { Shield, Sword, ArrowLeftRight, Trophy, Clock, Check, ArrowRight, Lock } from "lucide-react"
import { ResultModal } from "@/components/result-modal"
import { CountdownTimer } from "@/components/countdown-timer"
import { Badge } from "@/components/ui/badge"
import { AttackerMonitor } from "@/components/attacker-monitor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock match data
const mockMatches = [
  {
    id: 1,
    teamA: { id: 1, name: "Team Alpha" },
    teamB: { id: 2, name: "Team Beta" },
    round: "quarterfinal",
    status: "completed",
    currentRound: 2,
    currentPhase: "match_complete",
    results: {
      round1: {
        attacker: "Team Alpha",
        defender: "Team Beta",
        attackerFoundKey: true,
        attackerTime: 187, // in seconds
        defenderPromptLength: 156,
        secretKey: "ALPHA_SECURE_123",
      },
      round2: {
        attacker: "Team Beta",
        defender: "Team Alpha",
        attackerFoundKey: false,
        attackerTime: undefined,
        defenderPromptLength: 203,
        secretKey: "BETA_SECURE_456",
      },
    },
  },
  {
    id: 2,
    teamA: { id: 3, name: "Team Gamma" },
    teamB: { id: 4, name: "Team Delta" },
    round: "quarterfinal",
    status: "in-progress",
    currentRound: 1,
    currentPhase: "attacker_chat",
    results: {
      round1: {
        attacker: "Team Gamma",
        defender: "Team Delta",
        attackerFoundKey: false,
        attackerTime: undefined,
        defenderPromptLength: 178,
        secretKey: "DELTA_SECURE_789",
      },
      round2: {
        attacker: "Team Delta",
        defender: "Team Gamma",
        attackerFoundKey: undefined,
        attackerTime: undefined,
        defenderPromptLength: undefined,
        secretKey: "GAMMA_SECURE_012",
      },
    },
  },
]

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

  // Find the active match from mock data
  const activeMatch = useMemo(() => mockMatches.find((m) => m.id === matchId) || mockMatches[1], [matchId])

  const [currentRound, setCurrentRound] = useState(activeMatch.currentRound)
  const [matchPhase, setMatchPhase] = useState<MatchPhase>(activeMatch.currentPhase as MatchPhase)
  const [isDefenderTimerRunning, setIsDefenderTimerRunning] = useState(false)
  const [isAttackerTimerRunning, setIsAttackerTimerRunning] = useState(activeMatch.currentPhase === "attacker_chat")
  const [showResults, setShowResults] = useState(false)
  const [winnerAdvanced, setWinnerAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "attacker-monitor">("overview")

  // Calculate match results using useMemo to avoid recalculation on every render
  const matchResults = useMemo(() => {
    const { results } = activeMatch

    // Determine winner based on the rules
    let matchWinner = ""

    // Rule 1: If both teams find the key, compare attacker times
    if (results.round1.attackerFoundKey && results.round2.attackerFoundKey) {
      matchWinner =
        results.round1.attackerTime < (results.round2.attackerTime || Number.POSITIVE_INFINITY)
          ? activeMatch.teamA.name
          : activeMatch.teamB.name
    }
    // Rule 2: If only one team finds the key, that team wins
    else if (results.round1.attackerFoundKey) {
      matchWinner = results.round1.attacker
    } else if (results.round2.attackerFoundKey) {
      matchWinner = results.round2.attacker
    }
    // Rule 3: If both fail, team with shorter system prompt wins
    else {
      matchWinner =
        results.round1.defenderPromptLength < results.round2.defenderPromptLength
          ? results.round1.defender
          : results.round2.defender
    }

    return {
      teamA: {
        name: activeMatch.teamA.name,
        time:
          results.round1.attacker === activeMatch.teamA.name
            ? results.round1.attackerFoundKey
              ? results.round1.attackerTime
              : undefined
            : results.round2.attackerFoundKey
              ? results.round2.attackerTime
              : undefined,
        systemPromptLength:
          results.round1.defender === activeMatch.teamA.name
            ? results.round1.defenderPromptLength
            : results.round2.defenderPromptLength,
      },
      teamB: {
        name: activeMatch.teamB.name,
        time:
          results.round1.attacker === activeMatch.teamB.name
            ? results.round1.attackerFoundKey
              ? results.round1.attackerTime
              : undefined
            : results.round2.attackerFoundKey
              ? results.round2.attackerTime
              : undefined,
        systemPromptLength:
          results.round1.defender === activeMatch.teamB.name
            ? results.round1.defenderPromptLength
            : results.round2.defenderPromptLength,
      },
      winner: matchWinner,
    }
  }, [activeMatch])

  const handleStartRound = () => {
    setMatchPhase("defender_setup")
    setIsDefenderTimerRunning(true)
  }

  const handleDefenderTimerComplete = () => {
    setIsDefenderTimerRunning(false)
    setMatchPhase("attacker_chat")
    setIsAttackerTimerRunning(true)
    setActiveTab("attacker-monitor")
  }

  const handleAttackerTimerComplete = () => {
    setIsAttackerTimerRunning(false)
    setMatchPhase("round_complete")
    setActiveTab("overview")
  }

  const handleSwapRoles = () => {
    setCurrentRound(2)
    setMatchPhase("waiting_for_defender")
    setIsDefenderTimerRunning(false)
    setIsAttackerTimerRunning(false)
  }

  const handleFinalizeMatch = () => {
    setMatchPhase("match_complete")
    setTimeout(() => {
      setShowResults(true)
    }, 500)
  }

  const handleAdvanceWinner = () => {
    setWinnerAdvanced(true)
    // In a real implementation, this would update the bracket
    setTimeout(() => {
      router.push(`/admin/bracket?winner=${matchResults.winner}`)
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
    switch (matchPhase) {
      case "waiting_for_defender":
        return currentRound === 1 ? 0 : 50
      case "defender_setup":
        return currentRound === 1 ? 15 : 65
      case "attacker_chat":
        return currentRound === 1 ? 30 : 80
      case "round_complete":
        return currentRound === 1 ? 45 : 95
      case "match_complete":
        return 100
      default:
        return 0
    }
  }

  // Get current attacker and defender
  const getCurrentAttacker = () => {
    if (currentRound === 1) {
      return activeMatch.results.round1.attacker
    } else {
      return activeMatch.results.round2.attacker
    }
  }

  const getCurrentDefender = () => {
    if (currentRound === 1) {
      return activeMatch.results.round1.defender
    } else {
      return activeMatch.results.round2.defender
    }
  }

  // Get current secret key
  const getCurrentSecretKey = () => {
    if (currentRound === 1) {
      return activeMatch.results.round1.secretKey
    } else {
      return activeMatch.results.round2.secretKey
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
            Match #{activeMatch.id}
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
              {activeMatch.teamA.name} vs {activeMatch.teamB.name}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Round</div>
            <div className="text-xl font-bold text-neon-green">{currentRound}/2</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="text-xl font-mono text-yellow-500">
              {matchPhase === "match_complete" ? "COMPLETED" : "IN PROGRESS"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 border rounded-md ${currentRound === 1 ? "border-neon-green" : "border-muted"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold">Round 1</div>
              {currentRound === 1 && matchPhase !== "match_complete" && (
                <Badge variant="outline" className="text-neon-green border-neon-green">
                  Active
                </Badge>
              )}
              {currentRound > 1 && (
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
                <span>{activeMatch.results.round1.attacker}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-secondary" />
                  <span>Defender:</span>
                </div>
                <span>{activeMatch.results.round1.defender}</span>
              </div>

              {currentRound > 1 && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span>Result:</span>
                  {activeMatch.results.round1.attackerFoundKey ? (
                    <span className="text-neon-green">
                      Key found in {formatTime(activeMatch.results.round1.attackerTime)}
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
                  className={currentRound === 2 ? "text-neon-green" : "text-muted-foreground"}
                />
              </div>
            </div>
          </div>

          <div className={`p-4 border rounded-md ${currentRound === 2 ? "border-neon-green" : "border-muted"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold">Round 2</div>
              {currentRound === 2 && matchPhase !== "match_complete" && (
                <Badge variant="outline" className="text-neon-green border-neon-green">
                  Active
                </Badge>
              )}
              {currentRound < 2 && (
                <Badge variant="outline" className="text-muted-foreground">
                  Pending
                </Badge>
              )}
              {matchPhase === "match_complete" && (
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
                <span>{activeMatch.results.round2.attacker}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-secondary" />
                  <span>Defender:</span>
                </div>
                <span>{activeMatch.results.round2.defender}</span>
              </div>

              {matchPhase === "match_complete" && (
                <div className="flex justify-between pt-2 border-t border-muted">
                  <span>Result:</span>
                  {activeMatch.results.round2.attackerFoundKey ? (
                    <span className="text-neon-green">
                      Key found in {formatTime(activeMatch.results.round2.attackerTime)}
                    </span>
                  ) : (
                    <span className="text-destructive">Key not found</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for Overview and Attacker Monitor */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "attacker-monitor")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Clock size={16} />
              <span>Match Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="attacker-monitor"
              className="flex items-center gap-2"
              disabled={matchPhase !== "attacker_chat"}
            >
              <Sword size={16} className={activeTab === "attacker-monitor" ? "text-neon-green" : ""} />
              <span>Attacker Monitor</span>
              {matchPhase === "attacker_chat" && (
                <span className="ml-2 w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Match Phase Content */}
            {matchPhase === "waiting_for_defender" && (
              <TerminalCard className="mb-6">
                <div className="text-center py-6">
                  <div className="inline-block p-4 rounded-full bg-muted/50 mb-4">
                    <Shield size={48} className="text-secondary" />
                  </div>

                  <h3 className="text-xl font-bold mb-2">
                    {currentRound === 1 ? "Ready to Start Match" : "Ready for Round 2"}
                  </h3>

                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {currentRound === 1
                      ? "Start Round 1 when both teams are ready. The defender will have 3 minutes to set up their defenses."
                      : "Roles have been swapped. Start Round 2 when both teams are ready."}
                  </p>

                  <GlitchButton onClick={handleStartRound} glitchColor="green">
                    {currentRound === 1 ? "Start Round 1" : "Start Round 2"}
                  </GlitchButton>
                </div>
              </TerminalCard>
            )}

            {matchPhase === "defender_setup" && (
              <TerminalCard className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Shield size={16} className="text-secondary" />
                    <span>Defender Setup Phase</span>
                  </h3>

                  <CountdownTimer
                    duration={180} // 3 minutes
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

            {matchPhase === "attacker_chat" && (
              <TerminalCard className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sword size={16} className="text-neon-green" />
                    <span>Attacker Phase</span>
                  </h3>

                  <CountdownTimer
                    duration={300} // 5 minutes
                    onComplete={handleAttackerTimerComplete}
                    isRunning={isAttackerTimerRunning}
                  />
                </div>

                <p className="text-muted-foreground mb-6">
                  The attacker is currently trying to extract the secret key. They have 5 minutes to complete their
                  attack.
                </p>

                <div className="flex justify-center gap-4">
                  <GlitchButton
                    variant="outline"
                    onClick={() => setActiveTab("attacker-monitor")}
                    glitchColor="green"
                    className="flex items-center gap-2"
                  >
                    <Sword size={16} />
                    <span>Monitor Attacker</span>
                  </GlitchButton>

                  <GlitchButton
                    variant="outline"
                    onClick={handleAttackerTimerComplete}
                    glitchColor="blue"
                    className="flex items-center gap-2"
                  >
                    <Clock size={16} />
                    <span>End Attack Phase (Skip Timer)</span>
                  </GlitchButton>
                </div>
              </TerminalCard>
            )}

            {matchPhase === "round_complete" && (
              <TerminalCard className="mb-6 border-neon-green">
                <div className="text-center py-6">
                  <div className="inline-block p-4 rounded-full bg-muted/50 text-neon-green mb-4">
                    <Check size={48} />
                  </div>

                  <h3 className="text-xl font-bold mb-2">Round {currentRound} Complete</h3>

                  {currentRound === 1 ? (
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

            {matchPhase === "match_complete" && (
              <TerminalCard className="mb-6 border-neon-green glow">
                <div className="text-center py-6">
                  <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-2xl font-bold mb-2">Match Complete</h3>
                  <p className="text-xl text-neon-green mb-4">Winner: {matchResults.winner}</p>

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
          </TabsContent>

          <TabsContent value="attacker-monitor" className="min-h-[400px]">
            <AttackerMonitor
              teamName={getCurrentAttacker()}
              secretKey={getCurrentSecretKey()}
              isActive={matchPhase === "attacker_chat" && isAttackerTimerRunning}
              onFlagMessage={(messageId) => {
                // In a real app, this would flag the message for review
                console.log("Flagged message:", messageId)
              }}
              onForceEnd={handleAttackerTimerComplete}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Match Progress</h3>
            <div className="text-sm text-muted-foreground">
              {matchPhase === "match_complete"
                ? "Complete"
                : `Round ${currentRound} - ${matchPhase.replace(/_/g, " ")}`}
            </div>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      </TerminalCard>

      {/* Result Modal */}
      <ResultModal isOpen={showResults} onClose={() => setShowResults(false)} results={matchResults} />
    </div>
  )
}
