'use client'

import { useState, useRef, useEffect } from 'react'
import OriAvatar, { OriState } from '@/components/OriAvatar'
import ArchitecturePanel from '@/components/ArchitecturePanel'
import { ArchitectureDelta, ChatMessage, OriTurn } from '@/lib/types'

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
}

const PILL_LABELS = ['Tell us about you', 'Design your system', 'Architecture ready']

export default function DesignPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const [architecture, setArchitecture] = useState<ArchitectureDelta>({})
  const [progressPercent, setProgressPercent] = useState(0)
  const [oriState, setOriState] = useState<OriState>('idle')
  const [turnNumber, setTurnNumber] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [pillIndex, setPillIndex] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, isLoading])

  async function startSession() {
    setSessionStarted(true)
    setOriState('thinking')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
      const turn: OriTurn = await res.json()
      setOriState('speaking')
      setDisplayMessages([{ role: 'assistant', content: turn.message }])
      setMessages([{ role: 'assistant', content: turn.message }])
      setArchitecture(turn.architectureDelta || {})
      setProgressPercent(turn.progressPercent || 0)
      setTurnNumber(turn.turnNumber || 1)
      setTimeout(() => setOriState('listening'), 1200)
    } catch {
      setOriState('idle')
    }
  }

  async function sendMessage() {
    if (!inputValue.trim() || isLoading || sessionComplete) return
    const userText = inputValue.trim()
    setInputValue('')
    setIsLoading(true)
    setOriState('thinking')

    const userMsg: ChatMessage = { role: 'user', content: userText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setDisplayMessages((prev) => [...prev, { role: 'user', content: userText }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const turn: OriTurn = await res.json()

      setOriState('speaking')

      const assistantMsg: ChatMessage = { role: 'assistant', content: turn.message }
      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)
      setDisplayMessages((prev) => [...prev, { role: 'assistant', content: turn.message }])

      if (turn.architectureDelta) {
        setArchitecture((prev) => ({
          intentTaxonomy:
            turn.architectureDelta.intentTaxonomy ?? prev.intentTaxonomy,
          escalationFlow:
            turn.architectureDelta.escalationFlow ?? prev.escalationFlow,
          entitySchema:
            turn.architectureDelta.entitySchema ?? prev.entitySchema,
          toneGuide:
            turn.architectureDelta.toneGuide ?? prev.toneGuide,
        }))
      }

      setProgressPercent(turn.progressPercent || 0)
      setTurnNumber(turn.turnNumber || 0)

      if (turn.progressPercent > 30) setPillIndex(1)
      if (turn.architectureComplete) {
        setPillIndex(2)
        setSessionComplete(true)
        setOriState('complete')
        await saveSession(updatedMessages, turn.architectureDelta, userText)
        return
      }

      setTimeout(() => {
        setOriState('building')
        setTimeout(() => setOriState('listening'), 800)
      }, 1000)
    } catch {
      setDisplayMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
      setOriState('listening')
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function saveSession(
    finalMessages: ChatMessage[],
    finalArchitecture: ArchitectureDelta,
    productDescription: string
  ) {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: finalMessages,
          architecture: finalArchitecture,
          productDescription,
        }),
      })
      const data = await res.json()
      if (data.shareUrl) setShareUrl(data.shareUrl)
    } catch {
      console.error('Session save failed')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const pillState = (i: number) => {
    if (i < pillIndex) return 'done'
    if (i === pillIndex) return 'active'
    return 'pending'
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--arc-bg)',
        overflow: 'hidden',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 52,
          borderBottom: '1px solid var(--arc-border-soft)',
          background: 'var(--arc-surface)',
          flexShrink: 0,
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
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--arc-text)',
              letterSpacing: -0.3,
            }}
          >
            Arc
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {PILL_LABELS.map((label, i) => {
            const ps = pillState(i)
            return (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontFamily: 'var(--arc-mono)',
                  background:
                    ps === 'done'
                      ? 'rgba(108,99,255,0.12)'
                      : ps === 'active'
                      ? 'var(--arc-violet)'
                      : 'transparent',
                  color:
                    ps === 'done'
                      ? '#A5A0FF'
                      : ps === 'active'
                      ? '#fff'
                      : 'var(--arc-muted)',
                  border:
                    ps === 'done'
                      ? '1px solid rgba(108,99,255,0.3)'
                      : ps === 'active'
                      ? '1px solid var(--arc-violet)'
                      : '1px solid rgba(240,242,248,0.07)',
                }}
              >
                {label}
              </span>
            )
          })}
        </div>

        <span
          style={{
            fontSize: 10,
            color: 'var(--arc-muted)',
            fontFamily: 'var(--arc-mono)',
          }}
        >
          {turnNumber > 0 ? `turn ${turnNumber}` : 'ready'}
        </span>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 220px 1fr',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--arc-border-soft)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--arc-border-soft)',
              fontSize: 11,
              color: 'var(--arc-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontFamily: 'var(--arc-mono)',
              flexShrink: 0,
            }}
          >
            Conversation
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {!sessionStarted && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 16,
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'var(--arc-muted)', fontSize: 13, lineHeight: 1.6 }}>
                  Ori will interview you about your product and build your conversation architecture in real time.
                </p>
                <button
                  onClick={startSession}
                  style={{
                    background: 'var(--arc-violet)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: 13,
                    fontFamily: 'var(--arc-font)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Meet Ori
                </button>
              </div>
            )}

            {displayMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    background:
                      msg.role === 'assistant'
                        ? 'var(--arc-violet)'
                        : 'var(--arc-surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: msg.role === 'assistant' ? '#fff' : 'var(--arc-muted)',
                    flexShrink: 0,
                    border: msg.role === 'user' ? '1px solid var(--arc-border-soft)' : 'none',
                  }}
                >
                  {msg.role === 'assistant' ? 'O' : 'Y'}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    padding: '9px 12px',
                    borderRadius:
                      msg.role === 'assistant' ? '2px 8px 8px 8px' : '8px 2px 8px 8px',
                    maxWidth: '82%',
                    color: 'var(--arc-text)',
                    background:
                      msg.role === 'assistant'
                        ? 'var(--arc-surface2)'
                        : 'var(--arc-violet-dim)',
                    borderLeft:
                      msg.role === 'assistant' ? '2px solid var(--arc-violet)' : 'none',
                    border:
                      msg.role === 'user'
                        ? '1px solid rgba(108,99,255,0.2)'
                        : undefined,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    background: 'var(--arc-violet)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  O
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--arc-surface2)',
                    borderLeft: '2px solid var(--arc-violet)',
                    borderRadius: '2px 8px 8px 8px',
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((d) => (
                    <div
                      key={d}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#A5A0FF',
                        animation: 'blink 1.2s infinite',
                        animationDelay: `${d * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {sessionComplete && shareUrl && (
              <div
                style={{
                  background: 'var(--arc-success-dim)',
                  border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginTop: 8,
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--arc-success)', margin: '0 0 8px', fontWeight: 500 }}>
                  Architecture complete
                </p>
                <a
                  href={shareUrl}
                  style={{
                    fontSize: 11,
                    color: '#A5A0FF',
                    fontFamily: 'var(--arc-mono)',
                    textDecoration: 'none',
                  }}
                >
                  View shareable architecture →
                </a>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid var(--arc-border-soft)',
              display: 'flex',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || sessionComplete || !sessionStarted}
              placeholder={
                !sessionStarted
                  ? 'Click Meet Ori to begin...'
                  : sessionComplete
                  ? 'Architecture complete'
                  : 'Reply to Ori...'
              }
              style={{
                flex: 1,
                background: 'var(--arc-surface2)',
                border: '1px solid var(--arc-border-soft)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--arc-text)',
                fontFamily: 'var(--arc-font)',
                outline: 'none',
                opacity: sessionComplete ? 0.5 : 1,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || sessionComplete || !sessionStarted}
              style={{
                width: 34,
                height: 34,
                background: 'var(--arc-violet)',
                border: 'none',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading || sessionComplete ? 'default' : 'pointer',
                opacity: isLoading || sessionComplete ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 6L11 1L6 11L5.5 6.5L1 6Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#0A0D13',
            borderRight: '1px solid var(--arc-border-soft)',
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: 'var(--arc-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--arc-mono)',
              padding: '12px 0 0',
            }}
          >
            {oriState}
          </span>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <OriAvatar state={oriState} size={160} />
          </div>
          <div
            style={{
              padding: '10px 0 14px',
              fontSize: 10,
              color: 'var(--arc-muted)',
              fontFamily: 'var(--arc-mono)',
              textAlign: 'center',
            }}
          >
            Ori
          </div>
        </div>

        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ArchitecturePanel
            architecture={architecture}
            progressPercent={progressPercent}
          />
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
