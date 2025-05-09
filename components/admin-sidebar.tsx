"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { GlitchButton } from "@/components/ui/glitch-button"
import { TypingText } from "@/components/ui/typing-text"
import { LayoutDashboard, GitBranch, Swords, PlayCircle, LogOut } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tournament Bracket",
    href: "/admin/bracket",
    icon: GitBranch,
  },
  {
    title: "Manage Matches",
    href: "/admin/matches",
    icon: Swords,
  },
  {
    title: "Match Control",
    href: "/admin/control",
    icon: PlayCircle,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="w-64 h-screen border-r border-muted bg-background/90 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-muted">
        <h2 className="text-xl font-bold text-neon-green">
          <TypingText text="ADMIN CONSOLE" speed={50} />
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                "hover:bg-muted/50",
                isActive ? "bg-muted/50 text-neon-green glow" : "text-muted-foreground",
              )}
            >
              <item.icon size={18} />
              <span>{item.title}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-muted">
        <GlitchButton variant="outline" className="w-full justify-start gap-3" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </GlitchButton>
      </div>
    </div>
  )
}
