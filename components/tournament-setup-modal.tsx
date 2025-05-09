import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlitchButton } from "@/components/ui/glitch-button"
import { Users, Shuffle, Check } from "lucide-react"
import { useState } from "react"

interface Team {
  id: number
  name: string
}

interface TournamentSetupModalProps {
  isOpen: boolean
  onClose: () => void
  teams: Team[]
  onSetup: (matchups: [Team, Team][]) => void
}

export function TournamentSetupModal({ isOpen, onClose, teams, onSetup }: TournamentSetupModalProps) {
  const [mode, setMode] = useState<"auto" | "manual" | null>(null)
  const [manualMatchups, setManualMatchups] = useState<Array<[Team | null, Team | null]>>([
    [null, null],
    [null, null],
    [null, null],
    [null, null],
  ])
  const [isShuffling, setIsShuffling] = useState(false)
  const [shuffledTeams, setShuffledTeams] = useState<Team[]>([])
  const [autoConfirmed, setAutoConfirmed] = useState(false)

  // Auto matchup: shuffle teams and pair with animation
  const handleAutoMatchup = () => {
    setIsShuffling(true)
    setAutoConfirmed(false)
    let shuffleCount = 0
    const maxShuffles = 10
    const teamsArr = [...teams]
    const interval = setInterval(() => {
      const shuffled = [...teamsArr].sort(() => Math.random() - 0.5)
      setShuffledTeams(shuffled)
      shuffleCount++
      if (shuffleCount >= maxShuffles) {
        clearInterval(interval)
        setIsShuffling(false)
        setAutoConfirmed(true)
      }
    }, 200)
  }

  const handleAutoConfirm = () => {
    // Pair shuffled teams
    const matchups: [Team, Team][] = [
      [shuffledTeams[0], shuffledTeams[1]],
      [shuffledTeams[2], shuffledTeams[3]],
      [shuffledTeams[4], shuffledTeams[5]],
      [shuffledTeams[6], shuffledTeams[7]],
    ]
    onSetup(matchups)
    onClose()
  }

  // Manual matchup: collect pairs
  const handleManualSetup = () => {
    if (manualMatchups.every(pair => pair[0] && pair[1])) {
      onSetup(manualMatchups as [Team, Team][])
      onClose()
    }
  }

  // Helper for manual select
  const handleSelect = (matchIdx: number, teamIdx: number, teamId: string) => {
    const team = teams.find((t) => t.id === Number(teamId)) || null
    const updated = manualMatchups.map((pair, i) =>
      i === matchIdx ? [teamIdx === 0 ? team : pair[0], teamIdx === 1 ? team : pair[1]] : pair
    ) as Array<[Team | null, Team | null]>
    setManualMatchups(updated)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Setup Tournament</DialogTitle>
        </DialogHeader>
        {/* Show available teams at the top */}
        <div className="mb-4">
          <div className="font-semibold mb-2">Available Teams:</div>
          <div className="grid grid-cols-2 gap-2">
            {teams.map((t) => (
              <div key={t.id} className="border rounded px-2 py-1 text-sm bg-muted/30">{t.name}</div>
            ))}
          </div>
        </div>
        {/* Main content by mode */}
        {!mode && (
          <div className="flex flex-col gap-4 mt-6">
            <GlitchButton glitchColor="green" onClick={() => { setMode("auto"); handleAutoMatchup(); }} className="flex items-center gap-2">
              <Shuffle size={16} /> <span>Auto Matchup</span>
            </GlitchButton>
            <GlitchButton glitchColor="purple" onClick={() => setMode("manual")} className="flex items-center gap-2">
              <Check size={16} /> <span>Manual Matchup</span>
            </GlitchButton>
          </div>
        )}
        {/* Auto matchup animation and confirmation */}
        {mode === "auto" && (
          <div className="flex flex-col gap-4 items-center py-4 w-full">
            <div className="flex items-center justify-center mb-4">
              <Users size={48} className="text-neon-green animate-pulse" />
            </div>
            <div className="text-xl font-bold mb-4">
              {isShuffling ? "Generating Matchups..." : "Matchups Ready!"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 w-full">
              {Array.from({ length: 4 }).map((_, matchIndex) => {
                const team1Index = matchIndex * 2
                const team2Index = matchIndex * 2 + 1
                return (
                  <div
                    key={matchIndex}
                    className={`border border-muted rounded-md p-3 transition-all duration-300 ${isShuffling ? "animate-pulse" : ""}`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">Quarterfinal {matchIndex + 1}</div>
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-neon-green">{shuffledTeams[team1Index]?.name || "..."}</div>
                      <div className="text-xs">VS</div>
                      <div className="font-bold text-secondary">{shuffledTeams[team2Index]?.name || "..."}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {!isShuffling && autoConfirmed && (
              <GlitchButton glitchColor="green" onClick={handleAutoConfirm} className="flex items-center gap-2">
                <Check size={16} /> <span>Confirm</span>
              </GlitchButton>
            )}
            {!isShuffling && (
              <GlitchButton variant="outline" onClick={() => { setMode(null); setAutoConfirmed(false); }}>
                Back
              </GlitchButton>
            )}
          </div>
        )}
        {/* Manual matchup UI remains as before */}
        {mode === "manual" && (
          <div className="flex flex-col gap-4">
            <div className="mb-2 text-sm text-muted-foreground">Select teams for each matchup:</div>
            {manualMatchups.map((pair, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  className="border rounded px-2 py-1 bg-background"
                  value={pair[0]?.id || ""}
                  onChange={e => handleSelect(i, 0, e.target.value)}
                >
                  <option value="">Team 1</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={manualMatchups.some((p, idx) => idx !== i && (p[0]?.id === t.id || p[1]?.id === t.id))}>{t.name}</option>
                  ))}
                </select>
                <span className="text-muted-foreground">vs</span>
                <select
                  className="border rounded px-2 py-1 bg-background"
                  value={pair[1]?.id || ""}
                  onChange={e => handleSelect(i, 1, e.target.value)}
                >
                  <option value="">Team 2</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={manualMatchups.some((p, idx) => idx !== i && (p[0]?.id === t.id || p[1]?.id === t.id))}>{t.name}</option>
                  ))}
                </select>
              </div>
            ))}
            <GlitchButton glitchColor="purple" onClick={handleManualSetup} disabled={!manualMatchups.every(pair => pair[0] && pair[1])}>Confirm Manual Matchup</GlitchButton>
            <GlitchButton variant="outline" onClick={() => setMode(null)}>Back</GlitchButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
