'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import OriAvatar from '@/components/OriAvatar'

export default function LandingPage() {
  const router = useRouter()
  const [revealed, setRevealed] = useState(false)
  const [headlineVisible, setHeadlineVisible] = useState(false)
  const oriRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = oriRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !revealed) {
            setRevealed(true)
            setTimeout(() => setHeadlineVisible(true), 800)
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed])

  return (
    <div
      style={{
        background: 'var(--arc-bg)',
        minHeight: '100vh',
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
          position: 'sticky',
          top: 0,
          background: 'var(--arc-bg)',
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
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 32px 40px',
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
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            marginBottom: 20,
            maxWidth: 640,
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
            marginBottom: 48,
          }}
        >
          Ori interviews you about your product and returns a complete
          conversation architecture — intents, escalation flows, entity
          schema, tone principles.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'rgba(108,99,255,0.5)',
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.06em',
            }}
          >
            scroll to meet her
          </p>
          <div
            style={{
              width: 1,
              height: 40,
              background:
                'linear-gradient(to bottom, rgba(108,99,255,0.4), transparent)',
            }}
          />
        </div>
      </section>

      <section
        ref={oriRef}
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 32px',
        }}
      >
        <div
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'scale(1)' : 'scale(0.85)',
            transition: 'opacity 1.2s ease, transform 1.2s ease',
            marginBottom: 40,
          }}
        >
          <OriAvatar state={revealed ? 'listening' : 'idle'} size={260} />
        </div>

        <div
          style={{
            opacity: headlineVisible ? 1 : 0,
            transform: headlineVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.9s ease, transform 0.9s ease',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: 'var(--arc-muted)',
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.06em',
              marginBottom: 10,
            }}
          >
            This is Ori.
          </p>
          <p
            style={{
              fontSize: 16,
              color: 'var(--arc-text)',
              lineHeight: 1.6,
              maxWidth: 400,
              marginBottom: 32,
            }}
          >
            She asks one question at a time. By the time she is done, you
            have a complete conversation architecture for your product.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
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
      </section>

      <section
        style={{
          padding: '60px 32px 80px',
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
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--arc-text)',
                marginBottom: 8,
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--arc-muted)',
                lineHeight: 1.6,
              }}
            >
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
        <span style={{ fontSize: 11, color: 'var(--arc-muted)', fontFamily: 'var(--arc-mono)' }}>
          Built by Hannah Kraulik Pagade
        </span>
      </footer>
    </div>
  )
}
