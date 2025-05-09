"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<{ id: number; delay: number; left: string }[]>([])

  useEffect(() => {
    const newLines = []
    for (let i = 0; i < 15; i++) {
      newLines.push({
        id: i,
        delay: Math.random() * 5,
        left: `${Math.random() * 100}%`,
      })
    }
    setLines(newLines)
  }, [])

  return (
    <div className="circuit-bg min-h-screen w-full overflow-hidden relative">
      {lines.map((line) => (
        <div
          key={line.id}
          className="circuit-line"
          style={{
            left: line.left,
            animationDelay: `${line.delay}s`,
          }}
        />
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
