"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TypingText } from "@/components/ui/typing-text"
import { TerminalCard } from "@/components/ui/terminal-card"
import { TerminalInput } from "@/components/ui/terminal-input"
import { GlitchButton } from "@/components/ui/glitch-button"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Sword, Terminal, Eye, EyeOff } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"admin" | "team">("team")
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username and password are required")
      toast({
        title: "Authentication Error",
        description: "Username and password are required",
        variant: "destructive",
      })
      return
    }

    const success = await login(username, password, activeTab)

    if (success) {
      toast({
        title: "Login Successful",
        description: `Welcome, ${username}!`,
        variant: "success",
      })
      if (activeTab === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/arena")
      }
    } else {
      setError("Invalid credentials")
      toast({
        title: "Authentication Error",
        description: "Invalid credentials",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neon-green mb-2 flicker">
            <TypingText text="PROMPT WARS" speed={100} />
          </h1>
          <p className="text-muted-foreground">
            <TypingText text="Crypton Club Competitive Prompt Injection" speed={30} delay={1500} />
          </p>
        </div>

        <TerminalCard title="AUTHENTICATION TERMINAL">
          <Tabs
            defaultValue="team"
            className="w-full"
            onValueChange={(value) => setActiveTab(value as "admin" | "team")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="team" className="flex items-center gap-2">
                {activeTab === "team" ? <Sword size={16} className="text-neon-green" /> : <Shield size={16} />}
                <span>Team Login</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Terminal size={16} />
                <span>Admin Login</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Username</label>
                <TerminalInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm text-muted-foreground">Password</label>
                <TerminalInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute right-2 top-8 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Team Name</label>
                <TerminalInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="teamA" />
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm text-muted-foreground">Password</label>
                <TerminalInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute right-2 top-8 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </TabsContent>

            {error && <div className="text-destructive text-sm mt-2">{error}</div>}

            <div className="mt-6">
              <GlitchButton
                onClick={handleLogin}
                className="w-full"
                glitchColor={activeTab === "admin" ? "green" : "purple"}
              >
                AUTHENTICATE
              </GlitchButton>
            </div>
          </Tabs>
        </TerminalCard>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Demo credentials:</p>
          <p>Admin: admin/admin123</p>
          <p>Team: teamA/passA, teamB/passB, etc.</p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
