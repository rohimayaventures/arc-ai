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
    coreR: (time: number) => baseR * 0.24 + Math.sin(time * 2.5) * baseR * 0.05,
  }
}

/** Visual motion + emphasis per Ori mood — values are intentionally far apart between states. */
interface StateParams {
  ringMul: number
  ringAlphaScale: number
  particleAlphaMul: number
  threadMul: number
  threadLineWidthMul: number
  wavyMul: number
  wavyTime: number
  /** Multiplies time inside wavy sines — higher = more turbulent / faster rippling. */
  wavyFreqMul: number
  orbMul: number
  coreMul: number
  /** Scales how visible node cores + pulses read (0–1ish). */
  coreAlphaScale: number
  spinOrb: number
  nodeSpin: number
  travelSpeed: number
  nodePulseHz: number
  ringBreathe: number
  threadTeal: number
  wavyAlpha: number
  wavyWidth: number
  /** Radians per unit `t` (t += ~0.007/frame). 0 = diamond frozen (complete). */
  diamondSpin: number
}

function getStateParams(s: OriState): StateParams {
  switch (s) {
    case 'idle':
      return {
        ringMul: 0.42,
        ringAlphaScale: 0.45,
        particleAlphaMul: 0.28,
        threadMul: 0.48,
        threadLineWidthMul: 0.55,
        wavyMul: 0.18,
        wavyTime: 0.28,
        wavyFreqMul: 0.65,
        orbMul: 0.32,
        coreMul: 0.42,
        coreAlphaScale: 0.55,
        spinOrb: 0.22,
        nodeSpin: 0.18,
        travelSpeed: 0.12,
        nodePulseHz: 0.5,
        ringBreathe: 0.006,
        threadTeal: 0,
        wavyAlpha: 0.28,
        wavyWidth: 0.78,
        diamondSpin: 0.08,
      }
    case 'listening':
      return {
        ringMul: 1.12,
        ringAlphaScale: 1,
        particleAlphaMul: 1,
        threadMul: 1.08,
        threadLineWidthMul: 1,
        wavyMul: 1.02,
        wavyTime: 1.02,
        wavyFreqMul: 1,
        orbMul: 1.18,
        coreMul: 1.06,
        coreAlphaScale: 1,
        spinOrb: 1,
        nodeSpin: 1.02,
        travelSpeed: 0.26,
        nodePulseHz: 1.95,
        ringBreathe: 0.055,
        threadTeal: 0,
        wavyAlpha: 0.62,
        wavyWidth: 1.02,
        diamondSpin: 0.5,
      }
    case 'thinking':
      return {
        ringMul: 1.38,
        ringAlphaScale: 1.12,
        particleAlphaMul: 1.25,
        threadMul: 0.72,
        threadLineWidthMul: 0.88,
        wavyMul: 3.35,
        wavyTime: 2.55,
        wavyFreqMul: 3.1,
        orbMul: 1.52,
        coreMul: 1.38,
        coreAlphaScale: 1.08,
        spinOrb: 3.6,
        nodeSpin: 2.05,
        travelSpeed: 0.55,
        nodePulseHz: 5.8,
        ringBreathe: 0.085,
        threadTeal: 0,
        wavyAlpha: 0.82,
        wavyWidth: 1.38,
        diamondSpin: 2.25,
      }
    case 'speaking':
      return {
        ringMul: 1.28,
        ringAlphaScale: 1.05,
        particleAlphaMul: 1.08,
        threadMul: 1.72,
        threadLineWidthMul: 1.22,
        wavyMul: 1.58,
        wavyTime: 1.32,
        wavyFreqMul: 0.92,
        orbMul: 1.2,
        coreMul: 1.38,
        coreAlphaScale: 1.06,
        spinOrb: 0.92,
        nodeSpin: 1.05,
        travelSpeed: 0.44,
        nodePulseHz: 2.45,
        ringBreathe: 0.038,
        threadTeal: 0,
        wavyAlpha: 0.7,
        wavyWidth: 1.18,
        diamondSpin: 0.4,
      }
    case 'building':
      return {
        ringMul: 1.02,
        ringAlphaScale: 0.95,
        particleAlphaMul: 0.92,
        threadMul: 1.88,
        threadLineWidthMul: 1.32,
        wavyMul: 0.58,
        wavyTime: 0.88,
        wavyFreqMul: 1,
        orbMul: 0.95,
        coreMul: 1.04,
        coreAlphaScale: 0.98,
        spinOrb: 0.68,
        nodeSpin: 0.88,
        travelSpeed: 0.32,
        nodePulseHz: 1.48,
        ringBreathe: 0.022,
        threadTeal: 0.58,
        wavyAlpha: 0.55,
        wavyWidth: 0.95,
        diamondSpin: 0.3,
      }
    case 'complete':
      return {
        ringMul: 1.35,
        ringAlphaScale: 1.2,
        particleAlphaMul: 0.88,
        threadMul: 1.12,
        threadLineWidthMul: 1.05,
        wavyMul: 1.08,
        wavyTime: 0.52,
        wavyFreqMul: 0.75,
        orbMul: 0.68,
        coreMul: 1.62,
        coreAlphaScale: 1.12,
        spinOrb: 0.32,
        nodeSpin: 0.38,
        travelSpeed: 0.2,
        nodePulseHz: 1.05,
        ringBreathe: 0.072,
        threadTeal: 0.42,
        wavyAlpha: 0.5,
        wavyWidth: 1.22,
        diamondSpin: 0,
      }
  }
}

export default function OriAvatar({ state = 'idle', size = 200 }: OriAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<OriState>(state)
  const logicalSize = Math.max(32, Math.round(size))

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    const ctx: CanvasRenderingContext2D = canvasCtx

    const dpr =
      typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1
    canvas.width = Math.round(logicalSize * dpr)
    canvas.height = Math.round(logicalSize * dpr)
    canvas.style.width = `${logicalSize}px`
    canvas.style.height = `${logicalSize}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const W = logicalSize
    const H = logicalSize
    const cx = W / 2
    const cy = H / 2
    let t = 0
    let animFrame = 0

    const NODES = 7
    const ORBITERS = 70
    const g = geometry(logicalSize)

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

    function getNodes(time: number, nodeSpin: number) {
      const { baseR } = g
      return Array.from({ length: NODES }, (_, i) => {
        const a = (i / NODES) * Math.PI * 2 + time * 0.15 * nodeSpin
        const r = baseR + Math.sin(time * 0.9 + i * 1.7) * baseR * 0.18
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.007
      const s = stateRef.current
      const p = getStateParams(s)
      const nodes = getNodes(t, p.nodeSpin)
      const { baseR, wavyR } = g
      const wt = t * p.wavyTime
      const wf = p.wavyFreqMul

      let bgCenter = 'rgba(108,99,255,0.14)'
      if (s === 'idle') bgCenter = 'rgba(108,99,255,0.06)'
      else if (s === 'listening') bgCenter = 'rgba(108,99,255,0.17)'
      else if (s === 'thinking') bgCenter = 'rgba(184,146,74,0.22)'
      else if (s === 'speaking') bgCenter = 'rgba(165,160,255,0.2)'
      else if (s === 'building') bgCenter = 'rgba(45,212,191,0.12)'
      else if (s === 'complete') bgCenter = 'rgba(52,211,153,0.24)'

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, logicalSize * 0.55)
      bgGrad.addColorStop(0, bgCenter)
      bgGrad.addColorStop(0.45, 'rgba(108,99,255,0.05)')
      bgGrad.addColorStop(1, 'rgba(108,99,255,0)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      const pMul = p.particleAlphaMul
      particles.forEach((pt) => {
        ctx.fillStyle = `rgba(108,99,255,${pt.a * p.ringMul * pMul})`
        ctx.beginPath()
        ctx.arc(pt.xr * W, pt.yr * H, pt.r, 0, Math.PI * 2)
        ctx.fill()
      })

      const ringAlpha = p.ringAlphaScale
      for (let i = 0; i < 7; i++) {
        const radius = g.ring(i)
        const alpha =
          (0.055 + 0.022 * Math.sin(t * 1.2 - i * 0.5) + p.ringBreathe * Math.sin(t * 2.1 + i * 0.4)) *
          p.ringMul *
          ringAlpha
        ctx.strokeStyle = `rgba(108,99,255,${Math.min(0.22, alpha)})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      const tw = p.threadLineWidthMul
      for (let i = 0; i < NODES; i++) {
        for (let j = i + 2; j < NODES; j++) {
          const alpha = (0.1 + 0.045 * Math.sin(t * 0.6 + i + j)) * p.threadMul
          const a = Math.min(0.32, alpha)
          const te = p.threadTeal
          ctx.strokeStyle =
            te > 0
              ? `rgba(${Math.round(108 + (45 - 108) * te)},${Math.round(99 + (212 - 99) * te)},${Math.round(255 + (191 - 255) * te)},${a})`
              : `rgba(108,99,255,${a})`
          const baseLw = s === 'speaking' ? 0.82 : s === 'building' ? 0.76 : 0.65
          ctx.lineWidth = baseLw * tw
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
          Math.sin(angle * 4 + wt * 1.8 * wf) * baseR * 0.09 * p.wavyMul +
          Math.sin(angle * 6 - wt * 1.2 * wf) * baseR * 0.045 * p.wavyMul +
          Math.sin(angle * 9 + wt * 0.6 * wf) * baseR * 0.022 * p.wavyMul
        const rv = wavyR + w
        const px = cx + Math.cos(angle) * rv
        const py = cy + Math.sin(angle) * rv
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle =
        s === 'thinking'
          ? `rgba(108,99,255,${Math.min(0.88, p.wavyAlpha + 0.06)})`
          : s === 'complete'
            ? `rgba(52,211,153,${Math.min(0.55, p.wavyAlpha + 0.12)})`
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
        const tr =
          s === 'building'
            ? `rgba(180,220,210,${Math.min(0.95, alpha)})`
            : s === 'complete'
              ? `rgba(110,220,180,${Math.min(0.92, alpha * 0.95)})`
              : `rgba(165,160,255,${Math.min(0.95, alpha)})`
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
            (ob.radiusRatio * logicalSize + Math.sin(t * 1.6 + ob.phase) * baseR * 0.22)
        const targetY =
          cy +
          Math.sin(ob.angle) *
            (ob.radiusRatio * logicalSize + Math.sin(t * 1.6 + ob.phase) * baseR * 0.22)
        const alpha =
          (0.12 + 0.28 * Math.abs(Math.sin(t * 1.2 + ob.phase))) * p.orbMul
        const orbRgb =
          s === 'complete'
            ? `52,211,153`
            : s === 'building'
              ? `${Math.round(108 + (45 - 108) * 0.35)},${Math.round(99 + (212 - 99) * 0.35)},${Math.round(255 + (191 - 255) * 0.35)}`
              : '108,99,255'
        ctx.fillStyle = `rgba(${orbRgb},${Math.min(0.48, alpha)})`
        ctx.beginPath()
        ctx.arc(targetX, targetY, ob.size * 0.65, 0, Math.PI * 2)
        ctx.fill()
      })

      const cas = p.coreAlphaScale
      for (let i = 0; i < NODES; i++) {
        const pulse = 0.5 + 0.5 * Math.sin(t * p.nodePulseHz + i * 1.1)
        ctx.strokeStyle = `rgba(108,99,255,${pulse * 0.52 * p.threadMul * cas})`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(nodes[i].x, nodes[i].y, 3 + pulse * 2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(165,160,255,${(0.65 + pulse * 0.35) * p.coreMul * cas})`
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
        ctx.moveTo(cx + logicalSize * 0.12, cy)
        ctx.lineTo(cx + logicalSize * 0.4, cy)
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
        for (let ri = 0; ri < 4; ri++) {
          const phase = (t * 0.85 + ri * 0.22) % 1
          const rr = baseR * (1.05 + phase * 1.35)
          const successAlpha = (0.14 + 0.2 * (1 - phase)) * (0.85 + 0.15 * Math.sin(t * 2.2))
          ctx.strokeStyle = `rgba(52,211,153,${successAlpha})`
          ctx.lineWidth = 1.15 - ri * 0.18
          ctx.beginPath()
          ctx.arc(cx, cy, rr, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      const coreR = g.coreR(t) * p.coreMul
      const ca =
        s === 'thinking'
          ? 0.98
          : s === 'speaking'
            ? 1
            : s === 'complete'
              ? 0.98
              : s === 'idle'
                ? 0.55
                : 0.88
      const caEff = ca * p.coreAlphaScale
      const coreColor = s === 'complete' ? '52,211,153' : '108,99,255'

      for (let r = 4; r >= 1; r--) {
        ctx.fillStyle = `rgba(${coreColor},${(0.08 - r * 0.015) * caEff})`
        ctx.beginPath()
        ctx.arc(cx, cy, coreR + r * baseR * 0.12, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * p.diamondSpin)
      ctx.strokeStyle =
        s === 'complete'
          ? `rgba(52,211,153,${caEff * 0.92})`
          : `rgba(165,160,255,${caEff * 0.92})`
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
          ? `rgba(52,211,153,${caEff * 0.96})`
          : `rgba(165,160,255,${caEff * 0.96})`
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${caEff})`
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 0.045, 0, Math.PI * 2)
      ctx.fill()

      animFrame = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animFrame)
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={logicalSize}
      height={logicalSize}
      style={{
        display: 'block',
        width: logicalSize,
        height: logicalSize,
        maxWidth: '100%',
      }}
    />
  )
}
