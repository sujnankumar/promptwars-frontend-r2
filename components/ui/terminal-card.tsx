import type React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TerminalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  children: React.ReactNode
}

export function TerminalCard({ title, className, children, ...props }: TerminalCardProps) {
  return (
    <Card
      className={cn(
        "border border-muted bg-background/80 backdrop-blur-sm overflow-hidden",
        "terminal-transition",
        className,
      )}
      {...props}
    >
      {title && (
        <div className="border-b border-muted bg-muted/50 px-4 py-2 flex items-center">
          <div className="flex space-x-2 mr-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-neon-green" />
          </div>
          <div className="text-xs text-muted-foreground font-mono tracking-wider">{title}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </Card>
  )
}
