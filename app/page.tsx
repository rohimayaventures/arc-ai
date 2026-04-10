'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ArcMark from '@/components/ArcMark'

type StageSpec = { k: string; v: string }

const STAGES: Array<{
  mono: string
  headline: string
  body: string
  bodyQuiet?: string
  color: string
  chips: string[]
  spec: StageSpec[]
}> = [
  {
    mono: '01 · How you work in Arc',
    headline: 'Describe the product.\nArc listens in turns.',
    body: 'You talk; Arc captures what matters. No intake forms or decision trees — one focused prompt at a time.',
    bodyQuiet: 'Conversation-first capture — not a disguised form.',
    color: '#A5A0FF',
    chips: ['Single-thread', 'No forms'],
    spec: [
      { k: 'Mode', v: 'Guided interview' },
      { k: 'Turn rule', v: 'One question' },
    ],
  },
  {
    mono: '02 · Intent taxonomy',
    headline: 'What people want\nto accomplish.',
    body: 'Arc names the jobs users bring — clear intent labels you can ship against, each tied to something someone actually said.',
    color: '#82A8FF',
    chips: ['book_appointment', 'get_status', 'refund_request'],
    spec: [
      { k: 'Intents', v: '5–8 named' },
      { k: 'Style', v: 'snake_case' },
    ],
  },
  {
    mono: '03 · Escalation flow',
    headline: 'When it must\nleave the bot.',
    body: 'High-stakes or ambiguous paths get explicit handoffs: who is paged, under what signal, and where the thread resumes.',
    color: '#D4AE78',
    chips: ['Human handoff', 'Safety triggers'],
    spec: [
      { k: 'Example', v: 'risk_score > 0.8 → agent' },
      { k: 'Paths', v: '2–4 routes' },
    ],
  },
  {
    mono: '04 · Entity schema',
    headline: 'Fields the system\nmust remember.',
    body: 'Typed slots with required vs optional flags — the data contract your prompts and tools have to respect.',
    color: '#5EEAD4',
    chips: ['order_id', 'email', 'timezone'],
    spec: [
      { k: 'order_id', v: 'string · required' },
      { k: 'email', v: 'string · optional' },
    ],
  },
  {
    mono: '05 · Tone guide',
    headline: 'How it should\nsound to people.',
    body: 'Principles, not fluff — voice constraints you can test in copy and in model behavior.',
    color: '#F9A8D4',
    chips: ['Calm', 'Direct', 'No hype'],
    spec: [
      { k: 'Principles', v: '3–4 lines' },
      { k: 'Use', v: 'Review + prompts' },
    ],
  },
]

function bodyForStage(s: (typeof STAGES)[number], idx: number) {
  const quiet = idx === 1 || idx === 3
  return quiet && s.bodyQuiet ? s.bodyQuiet : s.body
}

/** 0–100: fills only while scroll is in this step’s share of the tour (1/n each). */
function tourSegmentBarPercent(narrativeProgress: number, stepIndex: number, totalSteps: number) {
  const p = Math.min(1, Math.max(0, narrativeProgress))
  const n = totalSteps
  const start = stepIndex / n
  const end = (stepIndex + 1) / n
  if (p <= start) return 0
  if (p >= end) return 100
  return ((p - start) / (end - start)) * 100
}

type StageDef = (typeof STAGES)[number]

function NarrativeTextLayer({
  stage,
  stageIndex,
  opacity,
}: {
  stage: StageDef
  stageIndex: number
  opacity: number
}) {
  const bodyText = bodyForStage(stage, stageIndex)
  if (opacity < 0.004) return null
  return (
    <div
      style={{
        opacity,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontFamily: 'var(--arc-mono)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: stage.color,
          margin: '0 0 14px',
        }}
      >
        {stage.mono}
      </p>
      <h2
        style={{
          fontSize: 'clamp(26px, 3.6vw, 40px)',
          fontWeight: 500,
          lineHeight: 1.14,
          letterSpacing: -0.6,
          color: '#F0F2F8',
          margin: '0 0 14px',
          whiteSpace: 'pre-line',
        }}
      >
        {stage.headline}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'rgba(228, 232, 242, 0.92)',
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 400,
        }}
      >
        {bodyText}
      </p>
      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          width: '100%',
          maxWidth: 400,
          borderTop: '1px solid rgba(108,99,255,0.1)',
        }}
      >
        {stage.spec.map((row) => (
          <div
            key={`${stage.mono}-${row.k}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 16,
              fontSize: 11,
              fontFamily: 'var(--arc-mono)',
              padding: '6px 0',
              color: 'rgba(176, 184, 204, 0.92)',
            }}
          >
            <span style={{ color: 'rgba(140, 150, 172, 0.95)' }}>{row.k}</span>
            <span style={{ textAlign: 'right', color: stage.color, opacity: 0.92 }}>{row.v}</span>
          </div>
        ))}
        <p style={{ margin: '12px 0 0', fontSize: 10, color: 'var(--arc-muted-dim)', fontFamily: 'var(--arc-mono)', letterSpacing: '0.06em' }}>
          δ architecture · {String(stageIndex + 1).padStart(2, '0')}/05
        </p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const narrativeRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const scrollProgressRef = useRef(0)
  const narrativeProgressRef = useRef(0)
  const mouseRef = useRef({ x: -1, y: -1 })
  const smoothMouseRef = useRef({ x: -1, y: -1 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [narrativeProgress, setNarrativeProgress] = useState(0)

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const pageProgress = Math.min(1, scrollTop / scrollable)
      setScrollProgress(pageProgress)

      const el = narrativeRef.current
      let narrativeP = 0
      let buildP = 0

      if (el) {
        const rect = el.getBoundingClientRect()
        const docTop = rect.top + scrollTop
        const range = el.offsetHeight - window.innerHeight
        if (range <= 0) {
          narrativeP = scrollTop >= docTop ? 1 : 0
        } else {
          narrativeP = (scrollTop - docTop) / range
          narrativeP = Math.min(1, Math.max(0, narrativeP))
        }
        narrativeProgressRef.current = narrativeP
        setNarrativeProgress(narrativeP)

        const lead =
          docTop > 120 ? Math.min(1, scrollTop / Math.max(docTop - 120, 1)) : Math.min(1, scrollTop / 400)
        const leadBuild = lead * 0.1
        if (scrollTop < docTop) {
          buildP = Math.max(leadBuild, pageProgress * 0.35)
        } else if (scrollTop >= docTop + Math.max(0, range)) {
          buildP = 1
        } else {
          buildP = 0.1 + narrativeP * 0.9
        }
      } else {
        buildP = pageProgress
        narrativeProgressRef.current = 0
        setNarrativeProgress(0)
      }

      scrollProgressRef.current = buildP
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    const ctx: CanvasRenderingContext2D = canvasCtx

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let t = 0
    const NODES = 7
    const ORBITERS = 70

    const particles = Array.from({ length: 320 }, () => ({
      xr: Math.random(),
      yr: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      a: 0.05 + Math.random() * 0.2,
    }))

    const orbiters = Array.from({ length: ORBITERS }, () => ({
      angle: Math.random() * Math.PI * 2,
      scatterAngle: Math.random() * Math.PI * 2,
      scatterRx: (Math.random() - 0.5) * 1.8,
      scatterRy: (Math.random() - 0.5) * 1.8,
      radiusRatio: 0.07 + Math.random() * 0.22,
      speed: (0.001 + Math.random() * 0.002) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      size: 0.9 + Math.random() * 1.9,
    }))

    function ease(x: number) {
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    }

    function oriPos() {
      const np = narrativeProgressRef.current
      const wobble = Math.sin(np * Math.PI) * 0.038
      const H = canvas!.height
      return {
        x: canvas!.width / 2 + (np - 0.5) * canvas!.width * 0.04,
        y: H * (0.5 + wobble),
      }
    }

    function baseR() {
      return Math.min(canvas!.width, canvas!.height) * 0.19
    }

    function getNodes(time: number) {
      const { x: cx, y: cy } = oriPos()
      const r0 = baseR()
      return Array.from({ length: NODES }, (_, i) => {
        const a = (i / NODES) * Math.PI * 2 + time * 0.15
        const r = r0 + Math.sin(time * 0.9 + i * 1.7) * r0 * 0.18
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })
    }

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      ctx.clearRect(0, 0, W, H)
      t += 0.007

      const rawP = scrollProgressRef.current
      const rp = ease(rawP) * 0.55 + rawP * 0.45
      const { x: ocx, y: ocy } = oriPos()
      const r0 = baseR()
      const nodes = getNodes(t)

      smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.07
      smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.07

      const bgGrad = ctx.createRadialGradient(ocx, ocy, 0, ocx, ocy, W * 0.6)
      bgGrad.addColorStop(0, 'rgba(108,99,255,0.11)')
      bgGrad.addColorStop(0.5, 'rgba(108,99,255,0.04)')
      bgGrad.addColorStop(1, 'rgba(108,99,255,0)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      particles.forEach((p) => {
        ctx.fillStyle = `rgba(108,99,255,${p.a})`
        ctx.beginPath()
        ctx.arc(p.xr * W, p.yr * H, p.r, 0, Math.PI * 2)
        ctx.fill()
      })

      const mx = smoothMouseRef.current.x
      const my = smoothMouseRef.current.y
      if (mx > 0 && my > 0) {
        const dx = ocx - mx
        const dy = ocy - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 20) {
          const cg = ctx.createRadialGradient(mx, my, 0, mx, my, 75)
          cg.addColorStop(0, 'rgba(165,160,255,0.2)')
          cg.addColorStop(0.4, 'rgba(108,99,255,0.07)')
          cg.addColorStop(1, 'rgba(108,99,255,0)')
          ctx.fillStyle = cg
          ctx.beginPath()
          ctx.arc(mx, my, 75, 0, Math.PI * 2)
          ctx.fill()

          const steps = 80
          const ang = Math.atan2(dy, dx)
          for (let i = 0; i < steps; i++) {
            const prog = i / steps
            const bx = mx + dx * prog
            const by = my + dy * prog
            const width = 40 * (1 - prog * 0.65)
            const alpha =
              0.052 * Math.sin(prog * Math.PI) * (0.5 + 0.5 * Math.sin(t * 2.5 + prog * 10))
            ctx.fillStyle = `rgba(108,99,255,${alpha})`
            ctx.beginPath()
            ctx.ellipse(bx, by, width * 0.5, width * 0.13, ang, 0, Math.PI * 2)
            ctx.fill()
          }

          const beamGrad = ctx.createLinearGradient(mx, my, ocx, ocy)
          beamGrad.addColorStop(0, 'rgba(165,160,255,0.0)')
          beamGrad.addColorStop(0.15, 'rgba(108,99,255,0.42)')
          beamGrad.addColorStop(0.52, 'rgba(184,146,74,0.32)')
          beamGrad.addColorStop(0.85, 'rgba(45,212,191,0.4)')
          beamGrad.addColorStop(1, 'rgba(45,212,191,0.04)')
          ctx.strokeStyle = beamGrad
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(mx, my)
          ctx.lineTo(ocx, ocy)
          ctx.stroke()
        }
      }

      if (rp > 0.05) {
        const ra = Math.min(1, (rp - 0.05) * 10)
        for (let i = 0; i < 7; i++) {
          const radius = r0 * 0.28 + i * r0 * 0.38
          const alpha = (0.055 + 0.022 * Math.sin(t * 1.2 - i * 0.5)) * ra
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(ocx, ocy, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      if (rp > 0.2) {
        const ta = Math.min(1, (rp - 0.2) * 6)
        for (let i = 0; i < NODES; i++) {
          for (let j = i + 2; j < NODES; j++) {
            const alpha = (0.1 + 0.045 * Math.sin(t * 0.6 + i + j)) * ta
            ctx.strokeStyle = `rgba(108,99,255,${alpha})`
            ctx.lineWidth = 0.65
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            const tmx =
              (nodes[i].x + nodes[j].x) / 2 + Math.sin(t * 0.8 + i * j * 0.3) * r0 * 0.55
            const tmy =
              (nodes[i].y + nodes[j].y) / 2 + Math.cos(t * 0.8 + i * j * 0.3) * r0 * 0.55
            ctx.quadraticCurveTo(tmx, tmy, nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      if (rp > 0.4) {
        const wa = Math.min(1, (rp - 0.4) * 7)
        const wR = r0 * 1.18
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const angle = (i / 200) * Math.PI * 2
          const w =
            Math.sin(angle * 4 + t * 1.8) * r0 * 0.09 +
            Math.sin(angle * 6 - t * 1.2) * r0 * 0.045 +
            Math.sin(angle * 9 + t * 0.6) * r0 * 0.022
          const rv = wR + w
          const px = ocx + Math.cos(angle) * rv
          const py = ocy + Math.sin(angle) * rv
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.strokeStyle = `rgba(108,99,255,${0.62 * wa})`
        ctx.lineWidth = 1.1
        ctx.stroke()
      }

      if (rp > 0.18) {
        const pa = Math.min(1, (rp - 0.18) * 5)
        for (let i = 0; i < NODES; i++) {
          const prog = (t * 0.32 + i / NODES) % 1
          const from = nodes[i]
          const to = nodes[(i + 3) % NODES]
          const tmx = (from.x + to.x) / 2 + Math.sin(t + i) * r0 * 0.52
          const tmy = (from.y + to.y) / 2 + Math.cos(t + i) * r0 * 0.52
          const px =
            (1 - prog) * (1 - prog) * from.x + 2 * (1 - prog) * prog * tmx + prog * prog * to.x
          const py =
            (1 - prog) * (1 - prog) * from.y + 2 * (1 - prog) * prog * tmy + prog * prog * to.y
          const alpha = Math.sin(prog * Math.PI) * 0.95 * pa
          ctx.fillStyle = `rgba(165,160,255,${alpha})`
          ctx.beginPath()
          ctx.arc(px, py, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      orbiters.forEach((ob) => {
        ob.angle += ob.speed
        const targetX =
          ocx +
          Math.cos(ob.angle) *
            (ob.radiusRatio * Math.min(W, H) + Math.sin(t * 1.6 + ob.phase) * r0 * 0.22)
        const targetY =
          ocy +
          Math.sin(ob.angle) *
            (ob.radiusRatio * Math.min(W, H) + Math.sin(t * 1.6 + ob.phase) * r0 * 0.22)
        const scatterX = ocx + ob.scatterRx * W * 0.5
        const scatterY = ocy + ob.scatterRy * H * 0.5
        const ep = ease(Math.min(1, scrollProgressRef.current * 3.8))
        const px = scatterX + (targetX - scatterX) * ep
        const py = scatterY + (targetY - scatterY) * ep
        const alpha =
          (0.12 + 0.28 * Math.abs(Math.sin(t * 1.2 + ob.phase))) *
          Math.min(1, scrollProgressRef.current * 6)
        ctx.fillStyle = `rgba(108,99,255,${alpha})`
        ctx.beginPath()
        ctx.arc(px, py, ob.size * 0.65, 0, Math.PI * 2)
        ctx.fill()
      })

      if (rp > 0.38) {
        const na = Math.min(1, (rp - 0.38) * 7)
        for (let i = 0; i < NODES; i++) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + i * 1.1)
          ctx.strokeStyle = `rgba(108,99,255,${pulse * 0.55 * na})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 3 + pulse * 2, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = `rgba(165,160,255,${(0.65 + pulse * 0.35) * na})`
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (rp > 0.62) {
        const ca = Math.min(1, (rp - 0.62) * 7)
        const coreR = (r0 * 0.24 + Math.sin(t * 2.5) * r0 * 0.05) * ca
        for (let i = 4; i >= 1; i--) {
          ctx.fillStyle = `rgba(108,99,255,${(0.08 - i * 0.015) * ca})`
          ctx.beginPath()
          ctx.arc(ocx, ocy, coreR + i * r0 * 0.12, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.save()
        ctx.translate(ocx, ocy)
        ctx.rotate(t * 0.55)
        ctx.strokeStyle = `rgba(165,160,255,${ca * 0.92})`
        ctx.lineWidth = 1.4
        const ds = coreR * 0.75
        ctx.beginPath()
        ctx.moveTo(0, -ds)
        ctx.lineTo(ds, 0)
        ctx.lineTo(0, ds)
        ctx.lineTo(-ds, 0)
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
        ctx.fillStyle = `rgba(165,160,255,${ca * 0.96})`
        ctx.beginPath()
        ctx.arc(ocx, ocy, r0 * 0.1 * ca, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(255,255,255,${ca})`
        ctx.beginPath()
        ctx.arc(ocx, ocy, r0 * 0.045 * ca, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const markScale = 1 + narrativeProgress * 0.1 + scrollProgress * 0.04

  return (
    <div style={{ background: 'var(--arc-bg)', fontFamily: 'var(--arc-font)', color: 'var(--arc-text)' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(108,99,255,0.12) 0%, rgba(60,52,140,0.05) 50%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
          opacity: 0.026,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            transform: `scale(${markScale})`,
            opacity: 0.035 + scrollProgress * 0.04,
          }}
        >
          <ArcMark size={200} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            height: 58,
            borderBottom: '1px solid rgba(108,99,255,0.1)',
            position: 'sticky',
            top: 0,
            background: 'rgba(10,12,18,0.92)',
            backdropFilter: 'blur(16px)',
            zIndex: 50,
          }}
        >
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArcMark size={26} />
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: '#F0F2F8',
                letterSpacing: -0.4,
                fontFamily: 'var(--arc-font)',
              }}
            >
              Arc
            </span>
          </button>
          <button
            onClick={() => router.push('/design')}
            style={{
              fontSize: 13,
              color: '#A5A0FF',
              border: '1px solid rgba(108,99,255,0.35)',
              background: 'rgba(108,99,255,0.08)',
              padding: '8px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'var(--arc-font)',
              fontWeight: 500,
              boxShadow:
                '0 2px 12px rgba(108, 99, 255, 0.22), 0 1px 4px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            }}
          >
            Meet Ori
          </button>
        </nav>

        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 32px 80px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.22)',
              borderRadius: 20,
              padding: '6px 16px',
              marginBottom: 32,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 24px rgba(108, 99, 255, 0.08)',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF' }} />
            <span
              style={{
                fontSize: 11,
                color: '#B4AEEB',
                fontFamily: 'var(--arc-mono)',
                letterSpacing: '0.05em',
              }}
            >
              One question at a time · Architecture in minutes
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(44px, 6.5vw, 76px)',
              fontWeight: 500,
              lineHeight: 1.06,
              letterSpacing: -2.5,
              marginBottom: 24,
              maxWidth: 760,
            }}
          >
            Design the conversation.
            <br />
            <span style={{ color: '#6C63FF' }}>Not the form.</span>
          </h1>

          <p
            style={{
              fontSize: 17,
              color: 'rgba(220, 224, 235, 0.94)',
              lineHeight: 1.7,
              maxWidth: 460,
              marginBottom: 44,
            }}
          >
            Ori interviews you about your product and returns a complete conversation architecture — intents,
            escalation flows, entity schema, tone principles.
          </p>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 22 }}>
            {['No forms', 'No scripts', 'Every path is different'].map((label, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#A8B0C4',
                  fontFamily: 'var(--arc-font)',
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#6C63FF',
                    opacity: 0.75,
                  }}
                />
                {label}
              </span>
            ))}
          </div>

          <p
            style={{
              marginTop: 40,
              fontSize: 11,
              color: '#8E96AC',
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.08em',
            }}
          >
            Five outputs below · intents → tone
          </p>
        </section>

        <div ref={narrativeRef} style={{ position: 'relative' }}>
          {STAGES.map((stage, i) => (
            <section
              key={stage.mono}
              style={{
                minHeight: 'min(880px, 88vh)',
                padding: 'clamp(48px, 8vh, 88px) clamp(20px, 5vw, 72px) clamp(56px, 9vh, 96px)',
                display: 'flex',
                gap: 'clamp(20px, 3vw, 36px)',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                borderTop: i === 0 ? undefined : '1px solid rgba(108,99,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 6,
                  flexShrink: 0,
                }}
              >
                {STAGES.map((s, j) => (
                  <div
                    key={s.mono}
                    style={{
                      width: j === i ? 9 : 7,
                      height: j === i ? 9 : 7,
                      borderRadius: '50%',
                      background: j === i ? s.color : j < i ? `${s.color}44` : 'rgba(108,99,255,0.12)',
                      boxShadow: j === i ? `0 0 14px ${s.color}77` : 'none',
                    }}
                  />
                ))}
              </div>

              <div style={{ flex: 1, minWidth: 0, maxWidth: 520, textAlign: 'left' }}>
                <NarrativeTextLayer stage={stage} stageIndex={i} opacity={1} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                  {stage.chips.map((c) => (
                    <span
                      key={c}
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--arc-mono)',
                        color: stage.color,
                        border: `1px solid ${stage.color}44`,
                        background: `${stage.color}14`,
                        padding: '5px 12px',
                        borderRadius: 999,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 28,
                    height: 2,
                    maxWidth: 320,
                    background: 'rgba(108,99,255,0.1)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${tourSegmentBarPercent(narrativeProgress, i, STAGES.length)}%`,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${stage.color}, ${
                        i < STAGES.length - 1 ? STAGES[i + 1].color : '#2DD4BF'
                      })`,
                      transition: 'width 0.08s linear',
                    }}
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        <section
          style={{
            padding: 'clamp(64px, 12vh, 120px) 32px clamp(72px, 14vh, 140px)',
            textAlign: 'center',
            background: 'rgba(10,12,18,0.32)',
            boxShadow: '0 -24px 48px rgba(0, 0, 0, 0.18)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--arc-muted-dim)',
              marginBottom: 16,
            }}
          >
            Ready when you are
          </p>
          <h2
            style={{
              fontSize: 'clamp(24px, 4vw, 34px)',
              fontWeight: 500,
              letterSpacing: -0.6,
              lineHeight: 1.2,
              marginBottom: 32,
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Start with Ori — one conversation, a full architecture.
          </h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => router.push('/design')}
              style={{
                background: '#6C63FF',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 28px',
                fontSize: 15,
                fontFamily: 'var(--arc-font)',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow:
                  '0 8px 32px rgba(108, 99, 255, 0.42), 0 4px 12px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              Start with Ori
            </button>
            <button
              type="button"
              onClick={() => router.push('/design')}
              style={{
                background: 'rgba(10,12,18,0.45)',
                color: '#A5A0FF',
                border: '1px solid rgba(108,99,255,0.32)',
                borderRadius: 10,
                padding: '14px 28px',
                fontSize: 15,
                fontFamily: 'var(--arc-font)',
                cursor: 'pointer',
                boxShadow:
                  '0 6px 24px rgba(0, 0, 0, 0.35), 0 0 20px rgba(108, 99, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              See an example
            </button>
          </div>
        </section>

        <footer
          style={{
            padding: '32px 32px 40px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            background: 'rgba(10,12,18,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArcMark size={18} />
            <span style={{ fontSize: 13, color: 'var(--arc-muted)' }}>Arc</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontSize: 11, color: '#B4BAC9', fontFamily: 'var(--arc-mono)', maxWidth: 420 }}>
              Design the conversation. Not the form. · Built with Arc by Ori
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
