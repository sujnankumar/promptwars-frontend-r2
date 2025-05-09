"use client"

import { useEffect, useRef } from "react"

interface BracketConnectorProps {
  startX: number
  startY: number
  endX: number
  endY: number
  color?: string
  animated?: boolean
}

export function BracketConnector({
  startX,
  startY,
  endX,
  endY,
  color = "#00ff00",
  animated = false,
}: BracketConnectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set line style
    ctx.strokeStyle = color
    ctx.lineWidth = 2

    // Calculate control points for curve
    const controlX = startX + (endX - startX) * 0.5

    // Draw curved path
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.bezierCurveTo(controlX, startY, controlX, endY, endX, endY)
    ctx.stroke()

    // Add glow effect
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.stroke()

    // Animation for line drawing
    if (animated) {
      let progress = 0
      const animationDuration = 30 // frames

      const animate = () => {
        if (progress >= animationDuration) return

        progress++
        const animProgress = progress / animationDuration

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.beginPath()
        ctx.moveTo(startX, startY)

        // Calculate points along the curve based on progress
        const t = animProgress
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * startY + t * t * endY

        ctx.bezierCurveTo(
          startX + (controlX - startX) * animProgress,
          startY,
          controlX + (endX - controlX) * animProgress,
          startY + (endY - startY) * animProgress,
          x,
          y,
        )

        ctx.stroke()

        requestAnimationFrame(animate)
      }

      animate()
    }
  }, [startX, startY, endX, endY, color, animated])

  return (
    <canvas
      ref={canvasRef}
      width={Math.abs(endX - startX) + 20}
      height={Math.abs(endY - startY) + 20}
      className="absolute pointer-events-none"
      style={{
        left: Math.min(startX, endX) - 10,
        top: Math.min(startY, endY) - 10,
      }}
    />
  )
}
