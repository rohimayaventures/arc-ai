'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [ctaVisible, setCtaVisible] = useState(false)
  const rafRef = useRef<number>(0)
  const progressRef = useRef(0)

  useEffect(() => {
    function onScroll() {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const windowH = window.innerHeight
      const sectionH = section.offsetHeight
      const scrolled = Math.max(0, -rect.top)
      const total = sectionH - windowH
      const progress = Math.min(1, Math.max(0, scrolled / total))
      progressRef.current = progress
      setScrollProgress(progress)
      if (progress > 0.85) setCtaVisible(true)
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

    const W = 320
    const H = 320
    const cx = W / 2
    const cy = H / 2
    let t = 0

    const NODES = 7
    const ORBITERS = 55

    const orbiters = Array.from({ length: ORBITERS }, () => ({
      angle: Math.random() * Math.PI * 2,
      scatterAngle: Math.random() * Math.PI * 2,
      scatterRadius: 120 + Math.random() * 80,
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

      if (rp > 0.08) {
        const ra = Math.min(1, (rp - 0.08) * 5)
        for (let r = 0; r < 6; r++) {
          const radius = W * 0.046 + r * W * 0.065
          const alpha = (0.035 + 0.02 * Math.sin(t * 1.2 - r * 0.5)) * ra
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      if (rp > 0.2) {
        const ta = Math.min(1, (rp - 0.2) * 3.5)
        for (let i = 0; i < NODES; i++) {
          for (let j = i + 2; j < NODES; j++) {
            const alpha = (0.07 + 0.04 * Math.sin(t * 0.6 + i + j)) * ta
            ctx.strokeStyle = `rgba(108,99,255,${alpha})`
            ctx.lineWidth = 0.6
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

      if (rp > 0.38) {
        const wa = Math.min(1, (rp - 0.38) * 3)
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
        ctx.strokeStyle = `rgba(108,99,255,${0.55 * wa})`
        ctx.lineWidth = 1.0
        ctx.stroke()
      }

      if (rp > 0.28) {
        const pa = Math.min(1, (rp - 0.28) * 3)
        for (let i = 0; i < NODES; i++) {
          const prog = (t * 0.35 + i / NODES) % 1
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
        const eased = ease(Math.min(1, progressRef.current * 2.5))
        const x = scatterX + (targetX - scatterX) * eased
        const y = scatterY + (targetY - scatterY) * eased
        const alpha =
          (0.1 + 0.25 * Math.abs(Math.sin(t * 1.2 + ob.phase))) *
          Math.min(1, progressRef.current * 3)
        ctx.fillStyle = `rgba(108,99,255,${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, ob.size * 0.65, 0, Math.PI * 2)
        ctx.fill()
      })

      if (rp > 0.48) {
        const na = Math.min(1, (rp - 0.48) * 4)
        for (let i = 0; i < NODES; i++) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + i * 1.1)
          ctx.strokeStyle = `rgba(108,99,255,${pulse * 0.5 * na})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 3 + pulse * 1.5, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = `rgba(165,160,255,${(0.6 + pulse * 0.4) * na})`
          ctx.beginPath()
          ctx.arc(nodes[i].x, nodes[i].y, 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (rp > 0.6) {
        const ca = Math.min(1, (rp - 0.6) * 4)
        const coreR = (W * 0.04 + Math.sin(t * 2.5) * W * 0.01) * ca
        for (let r = 3; r >= 1; r--) {
          ctx.fillStyle = `rgba(108,99,255,${(0.07 - r * 0.018) * ca})`
          ctx.beginPath()
          ctx.arc(cx, cy, coreR + r * W * 0.018, 0, Math.PI * 2)
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
        ctx.arc(cx, cy, W * 0.018 * ca, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(255,255,255,${ca})`
        ctx.beginPath()
        ctx.arc(cx, cy, W * 0.008 * ca, 0, Math.PI * 2)
        ctx.fill()
      }

      if (progressRef.current === 0) {
        const hint = 0.12 + 0.06 * Math.sin(t * 1.5)
        ctx.fillStyle = `rgba(108,99,255,${hint})`
        ctx.beginPath()
        ctx.arc(cx, cy, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const buildLabel = () => {
    if (scrollProgress < 0.1) return 'scroll to build her'
    if (scrollProgress < 0.25) return 'signal emerging...'
    if (scrollProgress < 0.45) return 'threads forming...'
    if (scrollProgress < 0.65) return 'wave ring stabilizing...'
    if (scrollProgress < 0.85) return 'core locking in...'
    return 'Ori'
  }

  return (
    <div
      style={{
        background: 'var(--arc-bg)',
        fontFamily: 'var(--arc-font)',
        color: 'var(--arc-text)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: 56,
          borderBottom: '1px solid var(--arc-border-soft)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'var(--arc-bg)',
          zIndex: 100,
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
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 32px 60px',
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
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            marginBottom: 20,
            maxWidth: 660,
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
            fontSize: 15,
            color: 'var(--arc-muted)',
            lineHeight: 1.7,
            maxWidth: 480,
            marginBottom: 52,
          }}
        >
          Ori interviews you about your product and returns a complete
          conversation architecture — intents, escalation flows, entity
          schema, tone principles.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(108,99,255,0.45)',
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.08em',
            }}
          >
            scroll to meet her
          </p>
          <div
            style={{
              width: 1,
              height: 48,
              background: 'linear-gradient(to bottom, rgba(108,99,255,0.5), transparent)',
            }}
          />
        </div>
      </section>

      <div
        ref={sectionRef}
        style={{ height: '400vh', position: 'relative' }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 24,
              transition: 'color 0.4s ease',
              color: scrollProgress > 0.85 ? '#A5A0FF' : 'var(--arc-muted)',
            }}
          >
            {buildLabel()}
          </p>

          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            style={{ display: 'block' }}
          />

          <div
            style={{
              marginTop: 32,
              height: 2,
              width: 200,
              background: 'rgba(108,99,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${scrollProgress * 100}%`,
                background: 'var(--arc-violet)',
                borderRadius: 2,
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          <div
            style={{
              marginTop: 40,
              opacity: ctaVisible ? 1 : 0,
              transform: ctaVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 15, color: 'var(--arc-text)', lineHeight: 1.6, maxWidth: 380 }}>
              She asks one question at a time. By the time she is done,
              you have a complete conversation architecture.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => router.push('/design')}
                style={{
                  background: 'var(--arc-violet)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 28px',
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
                  background: 'transparent',
                  color: '#A5A0FF',
                  border: '1px solid rgba(108,99,255,0.3)',
                  borderRadius: 8,
                  padding: '12px 28px',
                  fontSize: 14,
                  fontFamily: 'var(--arc-font)',
                  cursor: 'pointer',
                }}
              >
                See an example
              </button>
            </div>
          </div>
        </div>
      </div>

      <section
        style={{
          padding: '80px 32px',
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}
      >
        {[
          {
            label: 'One question per turn',
            body: 'Ori never asks two things at once. This discipline is the entire design argument.',
          },
          {
            label: 'Architecture builds live',
            body: 'Intent taxonomy, escalation flow, entity schema, and tone guide populate as you talk.',
          },
          {
            label: 'Shareable output',
            body: 'Every completed session generates a permanent URL your whole team can access.',
          },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: 'var(--arc-surface)',
              border: '1px solid var(--arc-border-soft)',
              borderRadius: 10,
              padding: '20px 22px',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--arc-violet)',
                marginBottom: 12,
              }}
            />
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 13, color: 'var(--arc-muted)', lineHeight: 1.6 }}>
              {card.body}
            </p>
          </div>
        ))}
      </section>

      <footer
        style={{
          borderTop: '1px solid var(--arc-border-soft)',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          Built by Hannah Kraulik Pagade
        </span>
      </footer>
    </div>
  )
}
