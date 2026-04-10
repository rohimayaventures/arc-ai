'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

function ArcMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M4 24 L14 4 L24 24"
        stroke="#6C63FF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 17 Q14 11 20 17"
        stroke="#A5A0FF"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="14" r="1.5" fill="#6C63FF" opacity="0.7" />
    </svg>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const oriCanvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const progressRef = useRef(0)

  useEffect(() => {
    function onScroll() {
      const maxScroll = document.body.scrollHeight - window.innerHeight
      progressRef.current = maxScroll > 0
        ? Math.min(1, window.scrollY / maxScroll)
        : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const canvas = oriCanvasRef.current
    if (!canvas) return
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    const ctx: CanvasRenderingContext2D = canvasCtx

    const W = 720
    const H = 720
    const cx = W / 2
    const cy = H / 2
    let t = 0
    const NODES = 7
    const ORBITERS = 65

    const particles = Array.from({ length: 260 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.3 + Math.random() * 0.9,
      a: 0.06 + Math.random() * 0.22,
    }))

    const orbiters = Array.from({ length: ORBITERS }, () => ({
      angle: Math.random() * Math.PI * 2,
      scatterAngle: Math.random() * Math.PI * 2,
      scatterRadius: 260 + Math.random() * 160,
      radius: W * 0.1 + Math.random() * W * 0.26,
      speed:
        (0.001 + Math.random() * 0.002) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      size: 0.9 + Math.random() * 1.8,
    }))

    function ease(x: number) {
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    }

    function getNodes(time: number) {
      return Array.from({ length: NODES }, (_, i) => {
        const a = (i / NODES) * Math.PI * 2 + time * 0.15
        const r =
          W * 0.175 + Math.sin(time * 0.9 + i * 1.7) * W * 0.032
        return {
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
        }
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t += 0.007
      const rp = ease(progressRef.current)
      const nodes = getNodes(t)

      particles.forEach((p) => {
        ctx.fillStyle = `rgba(108,99,255,${p.a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })

      const beamGrad = ctx.createLinearGradient(cx, 0, cx, cy * 0.9)
      beamGrad.addColorStop(0, 'rgba(108,99,255,0)')
      beamGrad.addColorStop(0.4, 'rgba(108,99,255,0.25)')
      beamGrad.addColorStop(0.85, 'rgba(165,160,255,0.5)')
      beamGrad.addColorStop(1, 'rgba(108,99,255,0.05)')
      ctx.fillStyle = beamGrad
      ctx.fillRect(cx - 18, 0, 36, cy * 0.9)

      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.18)
      coreGlow.addColorStop(0, 'rgba(108,99,255,0.14)')
      coreGlow.addColorStop(1, 'rgba(108,99,255,0)')
      ctx.fillStyle = coreGlow
      ctx.beginPath()
      ctx.arc(cx, cy, W * 0.18, 0, Math.PI * 2)
      ctx.fill()

      if (rp > 0.1) {
        const ra = Math.min(1, (rp - 0.1) * 8)
        for (let r = 0; r < 7; r++) {
          const radius = W * 0.046 + r * W * 0.063
          const alpha = (0.055 + 0.025 * Math.sin(t * 1.2 - r * 0.5)) * ra
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      if (rp > 0.28) {
        const ta = Math.min(1, (rp - 0.28) * 6)
        for (let i = 0; i < NODES; i++) {
          for (let j = i + 2; j < NODES; j++) {
            const alpha =
              (0.1 + 0.045 * Math.sin(t * 0.6 + i + j)) * ta
            ctx.strokeStyle = `rgba(108,99,255,${alpha})`
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            const mx =
              (nodes[i].x + nodes[j].x) / 2 +
              Math.sin(t * 0.8 + i * j * 0.3) * W * 0.08
            const my =
              (nodes[i].y + nodes[j].y) / 2 +
              Math.cos(t * 0.8 + i * j * 0.3) * W * 0.08
            ctx.quadraticCurveTo(mx, my, nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      if (rp > 0.48) {
        const wa = Math.min(1, (rp - 0.48) * 7)
        const wR = W * 0.205
        ctx.beginPath()
        for (let i = 0; i <= 200; i++) {
          const angle = (i / 200) * Math.PI * 2
          const w =
            Math.sin(angle * 4 + t * 1.8) * 13 +
            Math.sin(angle * 6 - t * 1.2) * 6 +
            Math.sin(angle * 9 + t * 0.6) * 3
          const r = wR + w
          const px = cx + Math.cos(angle) * r
          const py = cy + Math.sin(angle) * r
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.strokeStyle = `rgba(108,99,255,${0.65 * wa})`
        ctx.lineWidth = 1.1
        ctx.stroke()
      }

      if (rp > 0.22) {
        const pa = Math.min(1, (rp - 0.22) * 5)
        for (let i = 0; i < NODES; i++) {
          const prog = (t * 0.32 + i / NODES) % 1
          const from = nodes[i]
          const to = nodes[(i + 3) % NODES]
          const mx =
            (from.x + to.x) / 2 + Math.sin(t + i) * W * 0.075
          const my =
            (from.y + to.y) / 2 + Math.cos(t + i) * W * 0.075
          const x =
            (1 - prog) * (1 - prog) * from.x +
            2 * (1 - prog) * prog * mx +
            prog * prog * to.x
          const y =
            (1 - prog) * (1 - prog) * from.y +
            2 * (1 - prog) * prog * my +
            prog * prog * to.y
          const alpha = Math.sin(prog * Math.PI) * 0.95 * pa
          ctx.fillStyle = `rgba(165,160,255,${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      orbiters.forEach((ob) => {
        ob.angle += ob.speed
        const targetX =
          cx +
          Math.cos(ob.angle) *
            (ob.radius + Math.sin(t * 1.6 + ob.phase) * W * 0.03)
        const targetY =
          cy +
          Math.sin(ob.angle) *
            (ob.radius + Math.sin(t * 1.6 + ob.phase) * W * 0.03)
        const scatterX =
          cx + Math.cos(ob.scatterAngle) * ob.scatterRadius
        const scatterY =
          cy + Math.sin(ob.scatterAngle) * ob.scatterRadius
        const eased = ease(Math.min(1, progressRef.current * 3.2))
        const x = scatterX + (targetX - scatterX) * eased
        const y = scatterY + (targetY - scatterY) * eased
        const alpha =
          (0.12 + 0.28 * Math.abs(Math.sin(t * 1.2 + ob.phase))) *
          Math.min(1, progressRef.current * 5)
        ctx.fillStyle = `rgba(108,99,255,${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, ob.size * 0.65, 0, Math.PI * 2)
        ctx.fill()
      })

      if (rp > 0.42) {
        const na = Math.min(1, (rp - 0.42) * 6)
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

      if (rp > 0.65) {
        const ca = Math.min(1, (rp - 0.65) * 6)
        const coreR =
          (W * 0.042 + Math.sin(t * 2.5) * W * 0.009) * ca
        for (let r = 4; r >= 1; r--) {
          ctx.fillStyle = `rgba(108,99,255,${(0.08 - r * 0.016) * ca})`
          ctx.beginPath()
          ctx.arc(cx, cy, coreR + r * W * 0.018, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.save()
        ctx.translate(cx, cy)
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
        ctx.arc(cx, cy, W * 0.018 * ca, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(255,255,255,${ca})`
        ctx.beginPath()
        ctx.arc(cx, cy, W * 0.008 * ca, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
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
      body: 'Every completed session generates a permanent URL. Share your architecture with your team before you write a single prompt.',
    },
  ]

  return (
    <div
      style={{
        background: '#0A0C12',
        fontFamily: 'var(--arc-font)',
        color: 'var(--arc-text)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 70% at 50% 52%, rgba(108,99,255,0.16) 0%, rgba(60,52,140,0.07) 45%, transparent 72%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
          opacity: 0.028,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <canvas
          ref={oriCanvasRef}
          width={720}
          height={720}
          style={{ opacity: 0.75 }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
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
            background: 'rgba(10,12,18,0.82)',
            backdropFilter: 'blur(16px)',
            zIndex: 10,
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
            padding: '100px 32px 60px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(108,99,255,0.1)',
              border: '1px solid rgba(108,99,255,0.28)',
              borderRadius: 20,
              padding: '6px 16px',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#6C63FF',
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: '#A5A0FF',
                fontFamily: 'var(--arc-mono)',
                letterSpacing: '0.05em',
              }}
            >
              One question at a time · Architecture in minutes
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(42px, 6vw, 72px)',
              fontWeight: 500,
              lineHeight: 1.06,
              letterSpacing: -2.5,
              marginBottom: 24,
              maxWidth: 720,
            }}
          >
            Design the conversation.
            <br />
            <span style={{ color: '#6C63FF' }}>Not the form.</span>
          </h1>

          <p
            style={{
              fontSize: 17,
              color: 'var(--arc-muted)',
              lineHeight: 1.7,
              maxWidth: 460,
              marginBottom: 40,
            }}
          >
            Ori interviews you about your product and builds your complete
            conversation architecture live — intents, escalation flows,
            entity schema, tone principles.
          </p>

          <div
            style={{ display: 'flex', gap: 12, marginBottom: 20 }}
          >
            <button
              onClick={() => router.push('/design')}
              style={{
                background: '#6C63FF',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 32px',
                fontSize: 15,
                fontFamily: 'var(--arc-font)',
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: -0.2,
              }}
            >
              Start with Ori
            </button>
            <button
              onClick={() => router.push('/design')}
              style={{
                background: 'rgba(10,12,18,0.6)',
                color: '#A5A0FF',
                border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: 10,
                padding: '14px 32px',
                fontSize: 15,
                fontFamily: 'var(--arc-font)',
                cursor: 'pointer',
              }}
            >
              See an example
            </button>
          </div>

          <div
            style={{ display: 'flex', gap: 24, alignItems: 'center' }}
          >
            {['No forms', 'No scripts', 'Every path is different'].map(
              (label, i) => (
                <span
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#555',
                    fontFamily: 'var(--arc-font)',
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: '#6C63FF',
                      opacity: 0.6,
                    }}
                  />
                  {label}
                </span>
              )
            )}
          </div>

          <p
            style={{
              marginTop: 56,
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
            padding: '20px 32px 120px',
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(10,12,18,0.75)',
                border: '1px solid rgba(108,99,255,0.1)',
                borderLeft: '2px solid #6C63FF',
                borderRadius: '2px 12px 12px 2px',
                padding: '28px 32px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#6C63FF',
                  marginBottom: 12,
                }}
              />
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  marginBottom: 10,
                  letterSpacing: -0.4,
                }}
              >
                {f.label}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--arc-muted)',
                  lineHeight: 1.7,
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
              background: 'rgba(10,12,18,0.8)',
              border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: 20,
              padding: '52px 48px',
              maxWidth: 500,
              backdropFilter: 'blur(16px)',
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
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: -0.8,
                lineHeight: 1.15,
                marginBottom: 14,
              }}
            >
              She is ready when you are.
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--arc-muted)',
                lineHeight: 1.65,
                marginBottom: 28,
              }}
            >
              One conversation. A complete architecture. No forms,
              no scripts, no templates. Every path is different.
            </p>
            <button
              onClick={() => router.push('/design')}
              style={{
                background: '#6C63FF',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 0',
                fontSize: 15,
                fontFamily: 'var(--arc-font)',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                letterSpacing: -0.2,
              }}
            >
              Start with Ori
            </button>
          </div>
        </section>

        <footer
          style={{
            borderTop: '1px solid rgba(108,99,255,0.08)',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10,12,18,0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArcMark size={18} />
            <span style={{ fontSize: 13, color: 'var(--arc-muted)' }}>
              Arc
            </span>
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
