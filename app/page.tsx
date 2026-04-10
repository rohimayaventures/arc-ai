'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

function ArcMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M4 24 L14 4 L24 24" stroke="#6C63FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 17 Q14 11 20 17" stroke="#A5A0FF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="14" r="1.5" fill="#6C63FF" opacity="0.7" />
    </svg>
  )
}

const STAGES = [
  {
    threshold: 0.0,
    mono: 'step 01 — listening',
    headline: 'She starts\nby asking.',
    body: 'One question per turn. No forms, no checkboxes. Ori learns what you are building by listening to how you describe it.',
    color: '#A5A0FF',
  },
  {
    threshold: 0.2,
    mono: 'step 02 — intent taxonomy',
    headline: 'Your intents\ntake shape.',
    body: 'As you answer, Ori identifies the things users will want to do. Every intent gets a name. Every name has a reason.',
    color: '#A5A0FF',
  },
  {
    threshold: 0.4,
    mono: 'step 03 — escalation flow',
    headline: 'She maps\nwhat can go wrong.',
    body: 'High stakes inputs need clear paths. Ori builds your escalation architecture — who gets called, when, and why.',
    color: '#D4AE78',
  },
  {
    threshold: 0.6,
    mono: 'step 04 — entity schema',
    headline: 'The data\nyour system needs.',
    body: 'Every field your conversation must capture. Typed, labeled, and marked required or optional. Nothing assumed.',
    color: '#5EEAD4',
  },
  {
    threshold: 0.8,
    mono: 'step 05 — tone guide',
    headline: 'Then she\nfinds the voice.',
    body: 'Not a style guide. A set of principles. How this system sounds to the people who need it most.',
    color: '#F9A8D4',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const scrollProgressRef = useRef(0)
  const mouseRef = useRef({ x: -1, y: -1 })
  const smoothMouseRef = useRef({ x: -1, y: -1 })
  const [activeStage, setActiveStage] = useState(0)
  const [ctaVisible, setCtaVisible] = useState(false)

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  useEffect(() => {
    function onScroll() {
      const scrollable = document.body.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0
      scrollProgressRef.current = progress
      let stage = 0
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (progress >= STAGES[i].threshold) { stage = i; break }
      }
      setActiveStage(stage)
      setCtaVisible(progress > 0.92)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
      return { x: canvas!.width / 2, y: canvas!.height * 0.5 }
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

      const rp = ease(scrollProgressRef.current)
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
            const alpha = 0.052 * Math.sin(prog * Math.PI) * (0.5 + 0.5 * Math.sin(t * 2.5 + prog * 10))
            ctx.fillStyle = `rgba(108,99,255,${alpha})`
            ctx.beginPath()
            ctx.ellipse(bx, by, width * 0.5, width * 0.13, ang, 0, Math.PI * 2)
            ctx.fill()
          }

          const bg = ctx.createLinearGradient(mx, my, ocx, ocy)
          bg.addColorStop(0, 'rgba(165,160,255,0.0)')
          bg.addColorStop(0.15, 'rgba(108,99,255,0.42)')
          bg.addColorStop(0.52, 'rgba(184,146,74,0.32)')
          bg.addColorStop(0.85, 'rgba(45,212,191,0.4)')
          bg.addColorStop(1, 'rgba(45,212,191,0.04)')
          ctx.strokeStyle = bg
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
            const tmx = (nodes[i].x + nodes[j].x) / 2 + Math.sin(t * 0.8 + i * j * 0.3) * r0 * 0.55
            const tmy = (nodes[i].y + nodes[j].y) / 2 + Math.cos(t * 0.8 + i * j * 0.3) * r0 * 0.55
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
          const w = Math.sin(angle * 4 + t * 1.8) * r0 * 0.09 + Math.sin(angle * 6 - t * 1.2) * r0 * 0.045 + Math.sin(angle * 9 + t * 0.6) * r0 * 0.022
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
          const px = (1 - prog) * (1 - prog) * from.x + 2 * (1 - prog) * prog * tmx + prog * prog * to.x
          const py = (1 - prog) * (1 - prog) * from.y + 2 * (1 - prog) * prog * tmy + prog * prog * to.y
          const alpha = Math.sin(prog * Math.PI) * 0.95 * pa
          ctx.fillStyle = `rgba(165,160,255,${alpha})`
          ctx.beginPath()
          ctx.arc(px, py, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      orbiters.forEach((ob) => {
        ob.angle += ob.speed
        const targetX = ocx + Math.cos(ob.angle) * (ob.radiusRatio * Math.min(W, H) + Math.sin(t * 1.6 + ob.phase) * r0 * 0.22)
        const targetY = ocy + Math.sin(ob.angle) * (ob.radiusRatio * Math.min(W, H) + Math.sin(t * 1.6 + ob.phase) * r0 * 0.22)
        const scatterX = ocx + ob.scatterRx * W * 0.5
        const scatterY = ocy + ob.scatterRy * H * 0.5
        const ep = ease(Math.min(1, scrollProgressRef.current * 3.8))
        const px = scatterX + (targetX - scatterX) * ep
        const py = scatterY + (targetY - scatterY) * ep
        const alpha = (0.12 + 0.28 * Math.abs(Math.sin(t * 1.2 + ob.phase))) * Math.min(1, scrollProgressRef.current * 6)
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

  const stage = STAGES[activeStage]

  return (
    <div style={{ background: '#0A0C12', fontFamily: 'var(--arc-font)', color: 'var(--arc-text)' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      />

      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(108,99,255,0.12) 0%, rgba(60,52,140,0.05) 50%, transparent 75%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed', inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px', opacity: 0.026, pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <nav
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 32px', height: 58,
            borderBottom: '1px solid rgba(108,99,255,0.1)',
            position: 'sticky', top: 0,
            background: 'rgba(10,12,18,0.85)',
            backdropFilter: 'blur(16px)', zIndex: 10,
          }}
        >
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArcMark size={26} />
            <span style={{ fontSize: 16, fontWeight: 500, color: '#F0F2F8', letterSpacing: -0.4, fontFamily: 'var(--arc-font)' }}>Arc</span>
          </button>
          <button
            onClick={() => router.push('/design')}
            style={{ fontSize: 13, color: '#A5A0FF', border: '1px solid rgba(108,99,255,0.35)', background: 'rgba(108,99,255,0.08)', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--arc-font)', fontWeight: 500 }}
          >
            Meet Ori
          </button>
        </nav>

        <section
          style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 32px 80px', textAlign: 'center' }}
        >
          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.22)', borderRadius: 20, padding: '6px 16px', marginBottom: 32 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF' }} />
            <span style={{ fontSize: 11, color: '#8880CC', fontFamily: 'var(--arc-mono)', letterSpacing: '0.05em' }}>
              One question at a time · Architecture in minutes
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 6.5vw, 76px)', fontWeight: 500, lineHeight: 1.06, letterSpacing: -2.5, marginBottom: 24, maxWidth: 760 }}>
            Design the conversation.
            <br />
            <span style={{ color: '#6C63FF' }}>Not the form.</span>
          </h1>

          <p style={{ fontSize: 17, color: 'var(--arc-muted)', lineHeight: 1.7, maxWidth: 460, marginBottom: 44 }}>
            Ori interviews you about your product and returns a complete conversation architecture — intents, escalation flows, entity schema, tone principles.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            <button
              onClick={() => router.push('/design')}
              style={{ background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontFamily: 'var(--arc-font)', fontWeight: 500, cursor: 'pointer' }}
            >
              Start with Ori
            </button>
            <button
              onClick={() => router.push('/design')}
              style={{ background: 'rgba(10,12,18,0.5)', color: '#A5A0FF', border: '1px solid rgba(108,99,255,0.28)', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontFamily: 'var(--arc-font)', cursor: 'pointer' }}
            >
              See an example
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            {['No forms', 'No scripts', 'Every path is different'].map((label, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#444', fontFamily: 'var(--arc-font)' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6C63FF', opacity: 0.5 }} />
                {label}
              </span>
            ))}
          </div>

          <p style={{ marginTop: 56, fontSize: 10, color: 'rgba(108,99,255,0.35)', fontFamily: 'var(--arc-mono)', letterSpacing: '0.1em' }}>
            scroll — she builds as you go
          </p>
        </section>

        <div style={{ height: '500vh', position: 'relative' }}>
          <div
            style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '12vh', pointerEvents: 'none' }}
          >
            <div style={{ textAlign: 'center', maxWidth: 560, padding: '0 32px' }}>
              <p
                style={{ fontSize: 10, fontFamily: 'var(--arc-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: stage.color, marginBottom: 20, transition: 'color 0.5s ease, opacity 0.5s ease' }}
              >
                {stage.mono}
              </p>
              <h2
                style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 500, lineHeight: 1.1, letterSpacing: -1.5, color: '#F0F2F8', marginBottom: 16, whiteSpace: 'pre-line', transition: 'opacity 0.4s ease' }}
              >
                {stage.headline}
              </h2>
              <p
                style={{ fontSize: 16, color: 'var(--arc-muted)', lineHeight: 1.7, transition: 'opacity 0.4s ease' }}
              >
                {stage.body}
              </p>
            </div>
          </div>
        </div>

        <section
          style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px 100px', textAlign: 'center' }}
        >
          <div
            style={{ opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.9s ease, transform 0.9s ease', background: 'rgba(10,12,18,0.85)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 20, padding: '52px 48px', maxWidth: 480, backdropFilter: 'blur(16px)' }}
          >
            <p style={{ fontSize: 11, color: 'var(--arc-muted)', fontFamily: 'var(--arc-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Architecture complete
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 14 }}>
              She is ready when you are.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--arc-muted)', lineHeight: 1.65, marginBottom: 28 }}>
              One conversation. A complete architecture. No forms, no scripts, no templates. Every path is different.
            </p>
            <button
              onClick={() => router.push('/design')}
              style={{ background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 15, fontFamily: 'var(--arc-font)', fontWeight: 500, cursor: 'pointer', width: '100%', pointerEvents: ctaVisible ? 'all' : 'none' }}
            >
              Start with Ori
            </button>
          </div>
        </section>

        <footer
          style={{ borderTop: '1px solid rgba(108,99,255,0.08)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,12,18,0.92)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArcMark size={18} />
            <span style={{ fontSize: 13, color: 'var(--arc-muted)' }}>Arc</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--arc-muted)', fontFamily: 'var(--arc-mono)' }}>
            Design the conversation. Not the form. · Built with Arc by Ori
          </span>
        </footer>
      </div>
    </div>
  )
}
