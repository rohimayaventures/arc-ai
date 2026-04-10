'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const progressRef = useRef(0)

  useEffect(() => {
    function onScroll() {
      const maxScroll = document.body.scrollHeight - window.innerHeight
      progressRef.current = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0
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

    const W = 560
    const H = 560
    const cx = W / 2
    const cy = H / 2
    let t = 0
    const NODES = 7
    const ORBITERS = 55

    const orbiters = Array.from({ length: ORBITERS }, () => ({
      angle: Math.random() * Math.PI * 2,
      scatterAngle: Math.random() * Math.PI * 2,
      scatterRadius: 200 + Math.random() * 120,
      radius: W * 0.1 + Math.random() * W * 0.26,
      speed: (0.0015 + Math.random() * 0.003) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      size: 0.8 + Math.random() * 1.6,
    }))

    function ease(x: number) {
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    }

    function getNodes(time: number) {
      return Array.from({ length: NODES }, (_, i) => {
        const a = (i / NODES) * Math.PI * 2 + time * 0.18
        const r = W * 0.175 + Math.sin(time * 0.9 + i * 1.7) * W * 0.035
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.009
      const rp = ease(progressRef.current)
      const nodes = getNodes(t)

      if (rp > 0.05) {
        const ra = Math.min(1, (rp - 0.05) * 6)
        for (let r = 0; r < 6; r++) {
          const radius = W * 0.046 + r * W * 0.065
          const alpha = (0.04 + 0.02 * Math.sin(t * 1.2 - r * 0.5)) * ra
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      if (rp > 0.18) {
        const ta = Math.min(1, (rp - 0.18) * 4)
        for (let i = 0; i < NODES; i++) {
          for (let j = i + 2; j < NODES; j++) {
            const alpha = (0.08 + 0.04 * Math.sin(t * 0.6 + i + j)) * ta
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
      }

      if (rp > 0.35) {
        const wa = Math.min(1, (rp - 0.35) * 4)
        const wR = W * 0.205
        ctx.beginPath()
        for (let i = 0; i <= 180; i++) {
          const angle = (i / 180) * Math.PI * 2
          const w =
            Math.sin(angle * 4 + t * 2.0) * 11 +
            Math.sin(angle * 6 - t * 1.3) * 5 +
            Math.sin(angle * 9 + t * 0.7) * 3
          const r = wR + w
          const px = cx + Math.cos(angle) * r
          const py = cy + Math.sin(angle) * r
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.strokeStyle = `rgba(108,99,255,${0.6 * wa})`
        ctx.lineWidth = 1.0
        ctx.stroke()
      }

      if (rp > 0.25) {
        const pa = Math.min(1, (rp - 0.25) * 4)
        for (let i = 0; i < NODES; i++) {
          const prog = (t * 0.35 + i / NODES) % 1
          const from = nodes[i]
          const to = nodes[(i + 3) % NODES]
          const mx = (from.x + to.x) / 2 + Math.sin(t + i) * W * 0.075
          const my = (from.y + to.y) / 2 + Math.cos(t + i) * W * 0.075
          const x = (1 - prog) * (1 - prog) * from.x + 2 * (1 - prog) * prog * mx + prog * prog * to.x
          const y = (1 - prog) * (1 - prog) * from.y + 2 * (1 - prog) * prog * my + prog * prog * to.y
          const alpha = Math.sin(prog * Math.PI) * 0.9 * pa
          ctx.fillStyle = `rgba(165,160,255,${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      orbiters.forEach((ob) => {
        ob.angle += ob.speed
        const targetX = cx + Math.cos(ob.angle) * (ob.radius + Math.sin(t * 1.6 + ob.phase) * W * 0.032)
        const targetY = cy + Math.sin(ob.angle) * (ob.radius + Math.sin(t * 1.6 + ob.phase) * W * 0.032)
        const scatterX = cx + Math.cos(ob.scatterAngle) * ob.scatterRadius
        const scatterY = cy + Math.sin(ob.scatterAngle) * ob.scatterRadius
        const eased = ease(Math.min(1, progressRef.current * 2.8))
        const x = scatterX + (targetX - scatterX) * eased
        const y = scatterY + (targetY - scatterY) * eased
        const alpha = (0.08 + 0.2 * Math.abs(Math.sin(t * 1.2 + ob.phase))) * Math.min(1, progressRef.current * 4)
        ctx.fillStyle = `rgba(108,99,255,${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, ob.size * 0.65, 0, Math.PI * 2)
        ctx.fill()
      })

      if (rp > 0.45) {
        const na = Math.min(1, (rp - 0.45) * 5)
        for (let i = 0; i < NODES; i++) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + i * 1.1)
          ctx.strokeStyle = `rgba(108,99,255,${pulse * 0.45 * na})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 3 + pulse * 1.5, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = `rgba(165,160,255,${(0.55 + pulse * 0.4) * na})`
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (rp > 0.62) {
        const ca = Math.min(1, (rp - 0.62) * 5)
        const coreR = (W * 0.038 + Math.sin(t * 2.5) * W * 0.008) * ca
        for (let r = 3; r >= 1; r--) {
          ctx.fillStyle = `rgba(108,99,255,${(0.07 - r * 0.018) * ca})`
          ctx.beginPath()
          ctx.arc(cx, cy, coreR + r * W * 0.016, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(t * 0.6)
        ctx.strokeStyle = `rgba(165,160,255,${ca * 0.9})`
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
        ctx.fillStyle = `rgba(165,160,255,${ca * 0.95})`
        ctx.beginPath()
        ctx.arc(cx, cy, W * 0.016 * ca, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(255,255,255,${ca})`
        ctx.beginPath()
        ctx.arc(cx, cy, W * 0.007 * ca, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const features = [
    {
      label: 'One question per turn',
      body: 'Ori never asks two things at once. This discipline is the entire design argument — a conversation is not a form with a chat wrapper.',
    },
    {
      label: 'Architecture builds live',
      body: 'Intent taxonomy, escalation flow, entity schema, and tone guide populate in real time as you talk. You watch your system take shape.',
    },
    {
      label: 'Shareable output',
      body: 'Every completed session generates a permanent URL. Share your conversation architecture with your team before you write a single prompt.',
    },
  ]

  return (
    <div
      style={{
        background: 'var(--arc-bg)',
        fontFamily: 'var(--arc-font)',
        color: 'var(--arc-text)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <canvas ref={canvasRef} width={560} height={560} style={{ opacity: 0.62 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            height: 56,
            borderBottom: '1px solid var(--arc-border-soft)',
            position: 'sticky',
            top: 0,
            background: 'rgba(14,17,23,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                background: 'var(--arc-violet)',
                transform: 'rotate(45deg)',
                borderRadius: 3,
              }}
            />
            <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.3 }}>
              Arc
            </span>
          </div>
          <button
            onClick={() => router.push('/design')}
            style={{
              fontSize: 12,
              color: '#A5A0FF',
              border: '1px solid rgba(108,99,255,0.3)',
              background: 'transparent',
              padding: '6px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--arc-font)',
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
            padding: '80px 32px 60px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'var(--arc-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'var(--arc-mono)',
              marginBottom: 24,
            }}
          >
            A conversation design tool
          </p>
          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 60px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: -2,
              marginBottom: 22,
              maxWidth: 700,
            }}
          >
            Design the conversation.
            <br />
            <span style={{ color: 'var(--arc-violet)' }}>
              Before you write a line of code.
            </span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--arc-muted)',
              lineHeight: 1.7,
              maxWidth: 460,
              marginBottom: 44,
            }}
          >
            Ori interviews you about your product and returns a complete
            conversation architecture — intents, escalation flows, entity
            schema, tone principles.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => router.push('/design')}
              style={{
                background: 'var(--arc-violet)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '13px 30px',
                fontSize: 14,
                fontFamily: 'var(--arc-font)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Start with Ori
            </button>
            <button
              onClick={() => router.push('/design')}
              style={{
                background: 'rgba(14,17,23,0.6)',
                color: '#A5A0FF',
                border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: 8,
                padding: '13px 30px',
                fontSize: 14,
                fontFamily: 'var(--arc-font)',
                cursor: 'pointer',
              }}
            >
              See an example
            </button>
          </div>
          <p
            style={{
              marginTop: 52,
              fontSize: 10,
              color: 'rgba(108,99,255,0.35)',
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.1em',
            }}
          >
            scroll — she builds as you go
          </p>
        </section>

        <section
          style={{
            padding: '0 32px 120px',
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(14,17,23,0.78)',
                border: '1px solid var(--arc-border-soft)',
                borderLeft: '2px solid var(--arc-violet)',
                borderRadius: '2px 10px 10px 2px',
                padding: '28px 32px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--arc-violet)',
                  marginBottom: 12,
                }}
              />
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 10,
                  letterSpacing: -0.3,
                }}
              >
                {f.label}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--arc-muted)',
                  lineHeight: 1.65,
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(14,17,23,0.75)',
              border: '1px solid var(--arc-border-soft)',
              borderRadius: 16,
              padding: '48px 40px',
              maxWidth: 480,
              backdropFilter: 'blur(12px)',
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: 'var(--arc-muted)',
                fontFamily: 'var(--arc-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Ready to design
            </p>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: -0.6,
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              She is ready when you are.
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--arc-muted)',
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              One conversation. A complete architecture. No forms, no scripts,
              no templates.
            </p>
            <button
              onClick={() => router.push('/design')}
              style={{
                background: 'var(--arc-violet)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '13px 32px',
                fontSize: 14,
                fontFamily: 'var(--arc-font)',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Start with Ori
            </button>
          </div>
        </section>

        <footer
          style={{
            borderTop: '1px solid var(--arc-border-soft)',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(14,17,23,0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: 'var(--arc-violet)',
                transform: 'rotate(45deg)',
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--arc-muted)' }}>Arc</span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: 'var(--arc-muted)',
              fontFamily: 'var(--arc-mono)',
            }}
          >
            Design the conversation. Not the form. · Built with Arc by Ori
          </span>
        </footer>
      </div>
    </div>
  )
}
