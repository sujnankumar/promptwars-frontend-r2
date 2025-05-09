"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GlitchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  glitchColor?: "green" | "purple" | "blue"
  children: React.ReactNode
}

export function GlitchButton({
  className,
  variant = "default",
  size = "default",
  glitchColor = "green",
  children,
  ...props
}: GlitchButtonProps) {
  const [isHovering, setIsHovering] = useState(false)

  const glitchClass = {
    green: "glow",
    purple: "glow-purple",
    blue: "glow-blue",
  }[glitchColor]

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isHovering && glitchClass,
        isHovering && "glitch-effect",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-text={typeof children === "string" ? children : undefined}
      {...props}
    >
      {children}
    </Button>
  )
}
