'use client'

import { useEffect, useRef } from 'react'

export type OriState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'building' | 'complete'

interface OriAvatarProps {
  state?: OriState
  size?: number
}

export default function OriAvatar({ state = 'idle', size = 200 }: OriAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<OriState>(state)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    const ctx: CanvasRenderingContext2D = canvasCtx

    const W = size
    const H = size
    const cx = W / 2
    const cy = H / 2
    let t = 0

    const NODES = 7
    const ORBITERS = 50

    const orbiters = Array.from({ length: ORBITERS }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: W * 0.1 + Math.random() * W * 0.26,
      speed: (0.0015 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      size: 0.8 + Math.random() * 1.4,
    }))

    function getNodes(time: number, currentState: OriState) {
      const spinSpeed =
        currentState === 'thinking' ? 0.4
        : currentState === 'speaking' ? 0.28
        : 0.18
      const baseR = currentState === 'thinking' ? W * 0.185 : W * 0.175
      return Array.from({ length: NODES }, (_, i) => {
        const a = (i / NODES) * Math.PI * 2 + time * spinSpeed
        const r = baseR + Math.sin(time * 0.9 + i * 1.7) * W * 0.035
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })
    }

    function getStateParams(s: OriState) {
      switch (s) {
        case 'idle':
          return { orbitSpeed: 0.5, waveAmp: [7, 3, 2], waveFreq: [4, 6, 9], waveSpeed: [1.4, 0.9, 0.5], coreSize: W * 0.038, coreAlpha: 0.65, ringAlpha: 0.035, threadAlpha: 0.06 }
        case 'listening':
          return { orbitSpeed: 0.7, waveAmp: [8, 4, 2], waveFreq: [4, 6, 9], waveSpeed: [1.6, 1.0, 0.6], coreSize: W * 0.04, coreAlpha: 0.75, ringAlpha: 0.04, threadAlpha: 0.07 }
        case 'thinking':
          return { orbitSpeed: 2.2, waveAmp: [14, 7, 4], waveFreq: [4, 7, 11], waveSpeed: [3.2, 2.1, 1.2], coreSize: W * 0.045, coreAlpha: 0.9, ringAlpha: 0.07, threadAlpha: 0.05 }
        case 'speaking':
          return { orbitSpeed: 1.4, waveAmp: [11, 6, 3], waveFreq: [3, 5, 8], waveSpeed: [2.2, 1.6, 0.9], coreSize: W * 0.05, coreAlpha: 1.0, ringAlpha: 0.06, threadAlpha: 0.12 }
        case 'building':
          return { orbitSpeed: 1.0, waveAmp: [6, 3, 2], waveFreq: [5, 8, 12], waveSpeed: [1.8, 1.2, 0.7], coreSize: W * 0.036, coreAlpha: 0.8, ringAlpha: 0.05, threadAlpha: 0.14 }
        case 'complete':
          return { orbitSpeed: 0.6, waveAmp: [9, 5, 2], waveFreq: [4, 6, 9], waveSpeed: [1.5, 1.0, 0.6], coreSize: W * 0.042, coreAlpha: 0.9, ringAlpha: 0.05, threadAlpha: 0.1 }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.009
      const s = stateRef.current
      const p = getStateParams(s)
      const nodes = getNodes(t, s)
      const wR = s === 'thinking' ? W * 0.215 : W * 0.205

      for (let r = 0; r < 6; r++) {
        const radius = W * 0.046 + r * W * 0.065
        const alpha = p.ringAlpha + 0.02 * Math.sin(t * 1.2 - r * 0.5)
        ctx.strokeStyle = `rgba(108,99,255,${alpha})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (let i = 0; i < NODES; i++) {
        for (let j = i + 2; j < NODES; j++) {
          const alpha = p.threadAlpha + 0.04 * Math.sin(t * 0.6 + i + j)
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`
          ctx.lineWidth = 0.6
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          const mx = (nodes[i].x + nodes[j].x) / 2 + Math.sin(t * 0.8 + i * j * 0.3) * W * 0.08
          const my = (nodes[i].y + nodes[j].y) / 2 + Math.cos(t * 0.8 + i * j * 0.3) * W * 0.08
          ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y)
          ctx.stroke()
        }
      }

      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const angle = (i / 160) * Math.PI * 2
        const w =
          Math.sin(angle * p.waveFreq[0] + t * p.waveSpeed[0]) * p.waveAmp[0] +
          Math.sin(angle * p.waveFreq[1] - t * p.waveSpeed[1]) * p.waveAmp[1] +
          Math.sin(angle * p.waveFreq[2] + t * p.waveSpeed[2]) * p.waveAmp[2]
        const r = wR + w
        const px = cx + Math.cos(angle) * r
        const py = cy + Math.sin(angle) * r
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.strokeStyle =
        s === 'thinking' ? 'rgba(108,99,255,0.85)' : 'rgba(108,99,255,0.55)'
      ctx.lineWidth = s === 'thinking' ? 1.4 : 1.0
      ctx.stroke()

      for (let i = 0; i < NODES; i++) {
        const prog = (t * 0.35 + i / NODES) % 1
        const from = nodes[i]
        const to = nodes[(i + 3) % NODES]
        const mx = (from.x + to.x) / 2 + Math.sin(t + i) * W * 0.075
        const my = (from.y + to.y) / 2 + Math.cos(t + i) * W * 0.075
        const x =
          (1 - prog) * (1 - prog) * from.x +
          2 * (1 - prog) * prog * mx +
          prog * prog * to.x
        const y =
          (1 - prog) * (1 - prog) * from.y +
          2 * (1 - prog) * prog * my +
          prog * prog * to.y
        const alpha = Math.sin(prog * Math.PI) * 0.95
        ctx.fillStyle = `rgba(165,160,255,${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      orbiters.forEach((ob) => {
        ob.angle += ob.speed * p.orbitSpeed
        const breathe = Math.sin(t * 1.6 + ob.phase) * W * 0.032
        const x = cx + Math.cos(ob.angle) * (ob.radius + breathe)
        const y = cy + Math.sin(ob.angle) * (ob.radius + breathe)
        const alpha = 0.12 + 0.22 * Math.abs(Math.sin(t * 1.2 + ob.phase))
        ctx.fillStyle = `rgba(108,99,255,${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, ob.size * 0.6, 0, Math.PI * 2)
        ctx.fill()
      })

      for (let i = 0; i < NODES; i++) {
        const pulse =
          0.5 + 0.5 * Math.sin(t * (s === 'thinking' ? 3.5 : 1.8) + i * 1.1)
        ctx.strokeStyle = `rgba(108,99,255,${pulse * 0.5})`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, 3 + pulse * 1.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(165,160,255,${0.6 + pulse * 0.4})`
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      if (s === 'building') {
        ctx.strokeStyle = 'rgba(52,211,153,0.2)'
        ctx.lineWidth = 0.5
        ctx.setLineDash([3, 6])
        ctx.beginPath()
        ctx.moveTo(cx + W * 0.2, cy)
        ctx.lineTo(cx + W * 0.42, cy)
        ctx.stroke()
        ctx.setLineDash([])
      }

      if (s === 'complete') {
        const successAlpha = 0.3 + 0.2 * Math.sin(t * 2.5)
        ctx.strokeStyle = `rgba(52,211,153,${successAlpha})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, W * 0.22, 0, Math.PI * 2)
        ctx.stroke()
      }

      const coreR = p.coreSize + Math.sin(t * 2.5) * W * 0.01
      const ca = p.coreAlpha
      const coreColor = s === 'complete' ? '52,211,153' : '108,99,255'

      for (let r = 3; r >= 1; r--) {
        ctx.fillStyle = `rgba(${coreColor},${(0.07 - r * 0.018) * ca})`
        ctx.beginPath()
        ctx.arc(cx, cy, coreR + r * W * 0.018, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * (s === 'thinking' ? 1.8 : 0.6))
      ctx.strokeStyle =
        s === 'complete'
          ? `rgba(52,211,153,${ca * 0.9})`
          : `rgba(165,160,255,${ca * 0.9})`
      ctx.lineWidth = 1.2
      const ds = coreR * 0.75
      ctx.beginPath()
      ctx.moveTo(0, -ds)
      ctx.lineTo(ds, 0)
      ctx.lineTo(0, ds)
      ctx.lineTo(-ds, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()

      ctx.fillStyle =
        s === 'complete'
          ? `rgba(52,211,153,${ca * 0.95})`
          : `rgba(165,160,255,${ca * 0.95})`
      ctx.beginPath()
      ctx.arc(cx, cy, W * 0.018, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(255,255,255,${ca})`
      ctx.beginPath()
      ctx.arc(cx, cy, W * 0.008, 0, Math.PI * 2)
      ctx.fill()

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  )
}
