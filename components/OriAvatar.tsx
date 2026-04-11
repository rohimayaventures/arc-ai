'use client'

import { useEffect, useRef } from 'react'

export type OriState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'building' | 'complete'

interface OriAvatarProps {
  state?: OriState
  size?: number
}

/** Same proportional system as the marketing canvas (`app/page.tsx` Ori at full build). */
function geometry(size: number) {
  const baseR = size * 0.19
  return {
    baseR,
    ring: (i: number) => baseR * 0.28 + i * baseR * 0.38,
    wavyR: baseR * 1.18,
    coreR: (t: number) => baseR * 0.24 + Math.sin(t * 2.5) * baseR * 0.05,
  }
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
    const ORBITERS = 70
    const g = geometry(size)

    const particles = Array.from({ length: 140 }, () => ({
      xr: Math.random(),
      yr: Math.random(),
      r: 0.35 + Math.random() * 0.9,
      a: 0.04 + Math.random() * 0.16,
    }))

    const orbiters = Array.from({ length: ORBITERS }, () => ({
      angle: Math.random() * Math.PI * 2,
      scatterRx: (Math.random() - 0.5) * 1.8,
      scatterRy: (Math.random() - 0.5) * 1.8,
      radiusRatio: 0.07 + Math.random() * 0.22,
      speed: (0.001 + Math.random() * 0.002) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      size: 0.85 + Math.random() * 1.75,
    }))

    function getNodes(time: number, currentState: OriState, nodeSpin: number) {
      const { baseR } = g
      return Array.from({ length: NODES }, (_, i) => {
        const a = (i / NODES) * Math.PI * 2 + time * 0.15 * nodeSpin
        const r = baseR + Math.sin(time * 0.9 + i * 1.7) * baseR * 0.18
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })
    }

    /** Motion + emphasis per Ori mood (matches design page state machine). */
    function getStateParams(s: OriState) {
      switch (s) {
        case 'idle':
          return {
            ringMul: 1,
            threadMul: 1,
            wavyMul: 1,
            wavyTime: 1,
            orbMul: 1,
            coreMul: 1,
            spinOrb: 1,
            nodeSpin: 1,
            travelSpeed: 0.32,
            nodePulseHz: 1.8,
            ringBreathe: 0,
            threadTeal: 0,
            wavyAlpha: 0.58,
            wavyWidth: 1.05,
          }
        case 'listening':
          return {
            ringMul: 1.2,
            threadMul: 1.15,
            wavyMul: 1.12,
            wavyTime: 1.1,
            orbMul: 1.35,
            coreMul: 1.12,
            spinOrb: 1.45,
            nodeSpin: 1.28,
            travelSpeed: 0.26,
            nodePulseHz: 2.05,
            ringBreathe: 0.045,
            threadTeal: 0,
            wavyAlpha: 0.62,
            wavyWidth: 1,
          }
        case 'thinking':
          return {
            ringMul: 1.35,
            threadMul: 0.88,
            wavyMul: 1.55,
            wavyTime: 1.65,
            orbMul: 1.45,
            coreMul: 1.18,
            spinOrb: 2.25,
            nodeSpin: 1.42,
            travelSpeed: 0.36,
            nodePulseHz: 3.35,
            ringBreathe: 0.05,
            threadTeal: 0,
            wavyAlpha: 0.74,
            wavyWidth: 1.18,
          }
        case 'speaking':
          return {
            ringMul: 1.25,
            threadMul: 1.55,
            wavyMul: 1.38,
            wavyTime: 2.35,
            orbMul: 1.38,
            coreMul: 1.14,
            spinOrb: 1.62,
            nodeSpin: 1.22,
            travelSpeed: 0.5,
            nodePulseHz: 2.75,
            ringBreathe: 0.035,
            threadTeal: 0,
            wavyAlpha: 0.68,
            wavyWidth: 1.12,
          }
        case 'building':
          return {
            ringMul: 1.12,
            threadMul: 1.52,
            wavyMul: 1.18,
            wavyTime: 1.42,
            orbMul: 1.28,
            coreMul: 1.08,
            spinOrb: 1.35,
            nodeSpin: 1.18,
            travelSpeed: 0.4,
            nodePulseHz: 2.35,
            ringBreathe: 0.03,
            threadTeal: 0.42,
            wavyAlpha: 0.6,
            wavyWidth: 1.06,
          }
        case 'complete':
          return {
            ringMul: 1.05,
            threadMul: 1.1,
            wavyMul: 1.05,
            wavyTime: 1,
            orbMul: 1,
            coreMul: 1,
            spinOrb: 0.9,
            nodeSpin: 1,
            travelSpeed: 0.32,
            nodePulseHz: 1.75,
            ringBreathe: 0,
            threadTeal: 0,
            wavyAlpha: 0.56,
            wavyWidth: 1.02,
          }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.007
      const s = stateRef.current
      const p = getStateParams(s)
      const nodes = getNodes(t, s, p.nodeSpin)
      const { baseR, wavyR } = g
      const wt = t * p.wavyTime

      const bgCenter =
        s === 'listening' ? 'rgba(108,99,255,0.17)'
        : s === 'speaking' ? 'rgba(108,99,255,0.15)'
        : s === 'building' ? 'rgba(108,99,255,0.13)'
        : 'rgba(108,99,255,0.14)'
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.55)
      bgGrad.addColorStop(0, bgCenter)
      bgGrad.addColorStop(0.45, 'rgba(108,99,255,0.05)')
      bgGrad.addColorStop(1, 'rgba(108,99,255,0)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      particles.forEach((pt) => {
        ctx.fillStyle = `rgba(108,99,255,${pt.a * p.ringMul})`
        ctx.beginPath()
        ctx.arc(pt.xr * W, pt.yr * H, pt.r, 0, Math.PI * 2)
        ctx.fill()
      })

      for (let i = 0; i < 7; i++) {
        const radius = g.ring(i)
        const alpha =
          (0.055 + 0.022 * Math.sin(t * 1.2 - i * 0.5) + p.ringBreathe * Math.sin(t * 2.1 + i * 0.4)) *
          p.ringMul
        ctx.strokeStyle = `rgba(108,99,255,${Math.min(0.18, alpha)})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (let i = 0; i < NODES; i++) {
        for (let j = i + 2; j < NODES; j++) {
          const alpha = (0.1 + 0.045 * Math.sin(t * 0.6 + i + j)) * p.threadMul
          const a = Math.min(0.28, alpha)
          const te = p.threadTeal
          ctx.strokeStyle =
            te > 0
              ? `rgba(${Math.round(108 + (45 - 108) * te)},${Math.round(99 + (212 - 99) * te)},${Math.round(255 + (191 - 255) * te)},${a})`
              : `rgba(108,99,255,${a})`
          ctx.lineWidth = s === 'speaking' ? 0.78 : s === 'building' ? 0.72 : 0.65
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          const tmx =
            (nodes[i].x + nodes[j].x) / 2 + Math.sin(t * 0.8 + i * j * 0.3) * baseR * 0.55
          const tmy =
            (nodes[i].y + nodes[j].y) / 2 + Math.cos(t * 0.8 + i * j * 0.3) * baseR * 0.55
          ctx.quadraticCurveTo(tmx, tmy, nodes[j].x, nodes[j].y)
          ctx.stroke()
        }
      }

      ctx.beginPath()
      for (let i = 0; i <= 200; i++) {
        const angle = (i / 200) * Math.PI * 2
        const w =
          Math.sin(angle * 4 + wt * 1.8) * baseR * 0.09 * p.wavyMul +
          Math.sin(angle * 6 - wt * 1.2) * baseR * 0.045 * p.wavyMul +
          Math.sin(angle * 9 + wt * 0.6) * baseR * 0.022 * p.wavyMul
        const rv = wavyR + w
        const px = cx + Math.cos(angle) * rv
        const py = cy + Math.sin(angle) * rv
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle =
        s === 'thinking'
          ? `rgba(108,99,255,${Math.min(0.82, p.wavyAlpha + 0.08)})`
          : `rgba(108,99,255,${p.wavyAlpha})`
      ctx.lineWidth = p.wavyWidth
      ctx.stroke()

      for (let i = 0; i < NODES; i++) {
        const prog = (t * p.travelSpeed + i / NODES) % 1
        const from = nodes[i]
        const to = nodes[(i + 3) % NODES]
        const tmx = (from.x + to.x) / 2 + Math.sin(t + i) * baseR * 0.52
        const tmy = (from.y + to.y) / 2 + Math.cos(t + i) * baseR * 0.52
        const x =
          (1 - prog) * (1 - prog) * from.x + 2 * (1 - prog) * prog * tmx + prog * prog * to.x
        const y =
          (1 - prog) * (1 - prog) * from.y + 2 * (1 - prog) * prog * tmy + prog * prog * to.y
        const alpha = Math.sin(prog * Math.PI) * 0.95 * p.threadMul
        const tr = s === 'building' ? `rgba(180,220,210,${Math.min(0.95, alpha)})` : `rgba(165,160,255,${Math.min(0.95, alpha)})`
        ctx.fillStyle = s === 'speaking' ? `rgba(200,195,255,${Math.min(1, alpha * 1.08)})` : tr
        ctx.beginPath()
        ctx.arc(x, y, 2.1, 0, Math.PI * 2)
        ctx.fill()
      }

      orbiters.forEach((ob) => {
        ob.angle += ob.speed * p.spinOrb
        const targetX =
          cx +
          Math.cos(ob.angle) *
            (ob.radiusRatio * size + Math.sin(t * 1.6 + ob.phase) * baseR * 0.22)
        const targetY =
          cy +
          Math.sin(ob.angle) *
            (ob.radiusRatio * size + Math.sin(t * 1.6 + ob.phase) * baseR * 0.22)
        const alpha =
          (0.12 + 0.28 * Math.abs(Math.sin(t * 1.2 + ob.phase))) * p.orbMul
        ctx.fillStyle = `rgba(108,99,255,${Math.min(0.45, alpha)})`
        ctx.beginPath()
        ctx.arc(targetX, targetY, ob.size * 0.65, 0, Math.PI * 2)
        ctx.fill()
      })

      for (let i = 0; i < NODES; i++) {
        const pulse = 0.5 + 0.5 * Math.sin(t * p.nodePulseHz + i * 1.1)
        ctx.strokeStyle = `rgba(108,99,255,${pulse * 0.52 * p.threadMul})`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, 3 + pulse * 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(165,160,255,${(0.65 + pulse * 0.35) * p.coreMul})`
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      if (s === 'building') {
        const dashPhase = (t * 40) % 12
        ctx.strokeStyle = 'rgba(52,211,153,0.38)'
        ctx.lineWidth = 0.85
        ctx.setLineDash([4, 7])
        ctx.lineDashOffset = -dashPhase
        ctx.beginPath()
        ctx.moveTo(cx + size * 0.12, cy)
        ctx.lineTo(cx + size * 0.4, cy)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineDashOffset = 0
        ctx.strokeStyle = 'rgba(45,212,191,0.12)'
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.arc(cx, cy, wavyR + baseR * 0.06, -0.35, 0.35)
        ctx.stroke()
      }

      if (s === 'complete') {
        const successAlpha = 0.28 + 0.2 * Math.sin(t * 2.5)
        ctx.strokeStyle = `rgba(52,211,153,${successAlpha})`
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(cx, cy, baseR * 1.15, 0, Math.PI * 2)
        ctx.stroke()
      }

      const coreR = g.coreR(t) * p.coreMul
      const ca =
        s === 'thinking' ? 0.95
        : s === 'speaking' ? 1
        : s === 'complete' ? 0.92
        : 0.88
      const coreColor = s === 'complete' ? '52,211,153' : '108,99,255'

      for (let r = 4; r >= 1; r--) {
        ctx.fillStyle = `rgba(${coreColor},${(0.08 - r * 0.015) * ca})`
        ctx.beginPath()
        ctx.arc(cx, cy, coreR + r * baseR * 0.12, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * (s === 'thinking' ? 1.05 : 0.55))
      ctx.strokeStyle =
        s === 'complete'
          ? `rgba(52,211,153,${ca * 0.92})`
          : `rgba(165,160,255,${ca * 0.92})`
      ctx.lineWidth = 1.35
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
          ? `rgba(52,211,153,${ca * 0.96})`
          : `rgba(165,160,255,${ca * 0.96})`
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${ca})`
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 0.045, 0, Math.PI * 2)
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
