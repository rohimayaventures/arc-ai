'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import OriAvatar, { OriState } from '@/components/OriAvatar'
import ArchitecturePanel from '@/components/ArchitecturePanel'
import { ArchitectureDelta, ChatMessage, OriTurn } from '@/lib/types'

function ArcMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M4 24 L14 4 L24 24" stroke="#6C63FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 17 Q14 11 20 17" stroke="#A5A0FF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="14" r="1.5" fill="#6C63FF" opacity="0.7" />
    </svg>
  )
}

const PILL_LABELS = ['Tell us about you', 'Design your system', 'Architecture ready']

const STATE_GLOW: Record<OriState, string> = {
  idle:      'rgba(108,99,255,0.03)',
  listening: 'rgba(108,99,255,0.16)',
  thinking:  'rgba(184,146,74,0.26)',
  speaking:  'rgba(165,160,255,0.20)',
  building:  'rgba(45,212,191,0.18)',
  complete:  'rgba(52,211,153,0.28)',
}

const STATE_RING: Record<OriState, string> = {
  idle:      'rgba(108,99,255,0.04)',
  listening: 'rgba(108,99,255,0.24)',
  thinking:  'rgba(184,146,74,0.38)',
  speaking:  'rgba(165,160,255,0.30)',
  building:  'rgba(45,212,191,0.26)',
  complete:  'rgba(52,211,153,0.42)',
}

const STATE_LABEL_COLOR: Record<OriState, string> = {
  idle:      '#333',
  listening: '#8880CC',
  thinking:  '#D4AE78',
  speaking:  '#A5A0FF',
  building:  '#5EEAD4',
  complete:  '#34D399',
}

export default function DesignPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [displayMessages, setDisplayMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
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
  const [architectureOverlayOpen, setArchitectureOverlayOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, isLoading])

  const resizeComposer = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 168
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 40), max)}px`
  }, [])

  useEffect(() => {
    resizeComposer()
  }, [inputValue, resizeComposer])

  useEffect(() => {
    if (!architectureOverlayOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setArchitectureOverlayOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [architectureOverlayOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setArchitectureOverlayOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const startSession = useCallback(async () => {
    setSessionStarted(true)
    setOriState('thinking')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
      const payload: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          typeof (payload as { error?: string }).error === 'string'
            ? (payload as { error: string }).error
            : `Ori could not start (${res.status}). Check ANTHROPIC_API_KEY and try again.`
        setDisplayMessages([{ role: 'assistant', content: errMsg }])
        setOriState('idle')
        return
      }
      const turn = payload as OriTurn
      if (turn.message) {
        setOriState('speaking')
        setDisplayMessages([{ role: 'assistant', content: turn.message }])
        setMessages([{ role: 'assistant', content: turn.message }])
        setArchitecture(turn.architectureDelta || {})
        setProgressPercent(turn.progressPercent || 0)
        setTurnNumber(turn.turnNumber || 1)
        setTimeout(() => setOriState('listening'), 1400)
      } else {
        throw new Error('No message in response')
      }
    } catch (err) {
      console.error('startSession failed:', err)
      setDisplayMessages([{
        role: 'assistant',
        content: 'Ori failed to start. Check your ANTHROPIC_API_KEY in .env.local and restart the dev server.',
      }])
      setOriState('idle')
    }
  }, [])

  const sendMessage = useCallback(async () => {
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
      const payload: unknown = await res.json()
      if (!res.ok) {
        const errMsg =
          typeof (payload as { error?: string }).error === 'string'
            ? (payload as { error: string }).error
            : `Ori could not respond (${res.status}). Please try again.`
        setDisplayMessages((prev) => [
          ...prev,
          { role: 'assistant', content: errMsg },
        ])
        setOriState('listening')
        return
      }
      const turn = payload as OriTurn
      setOriState('speaking')
      const assistantMsg: ChatMessage = { role: 'assistant', content: turn.message }
      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)
      setDisplayMessages((prev) => [...prev, { role: 'assistant', content: turn.message }])
      if (turn.architectureDelta) {
        setArchitecture((prev) => ({
          intentTaxonomy: turn.architectureDelta.intentTaxonomy ?? prev.intentTaxonomy,
          escalationFlow: turn.architectureDelta.escalationFlow ?? prev.escalationFlow,
          entitySchema:   turn.architectureDelta.entitySchema ?? prev.entitySchema,
          toneGuide:      turn.architectureDelta.toneGuide ?? prev.toneGuide,
        }))
        setTimeout(() => setOriState('building'), 800)
        setTimeout(() => setOriState('listening'), 1600)
      } else {
        setTimeout(() => setOriState('listening'), 1200)
      }
      setProgressPercent(turn.progressPercent || 0)
      setTurnNumber(turn.turnNumber || 0)
      if (turn.progressPercent > 30) setPillIndex(1)
      if (turn.architectureComplete) {
        setPillIndex(2)
        setSessionComplete(true)
        setOriState('complete')
        await saveSession(updatedMessages, turn.architectureDelta, userText)
      }
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
  }, [inputValue, isLoading, sessionComplete, messages])

  const saveSession = async (
    finalMessages: ChatMessage[],
    finalArchitecture: ArchitectureDelta,
    productDescription: string
  ) => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMessages, architecture: finalArchitecture, productDescription }),
      })
      const data = await res.json()
      if (data.shareUrl) setShareUrl(data.shareUrl)
    } catch { console.error('Session save failed') }
  }

  const pillState = (i: number) => {
    if (i < pillIndex) return 'done'
    if (i === pillIndex) return 'active'
    return 'pending'
  }

  const sectionsComplete = [
    !!(architecture.intentTaxonomy?.length),
    !!(architecture.escalationFlow?.length),
    !!(architecture.entitySchema?.length),
    !!(architecture.toneGuide?.length),
  ].filter(Boolean).length

  const progressColors = ['#6C63FF', '#B8924A', '#2DD4BF', '#F472B6']
  const currentProgressColor = progressColors[Math.max(0, sectionsComplete - 1)] || '#6C63FF'

  function exportMarkdown(): string {
    const lines: string[] = ['# Conversation Architecture', '']
    if (architecture.intentTaxonomy?.length) {
      lines.push('## Intent Taxonomy', '')
      architecture.intentTaxonomy.forEach((i) => lines.push(`- ${i}`))
      lines.push('')
    }
    if (architecture.escalationFlow?.length) {
      lines.push('## Escalation Flow', '')
      architecture.escalationFlow.forEach((e) => lines.push(`- **${e.trigger}** → ${e.destination}${e.condition ? ` (${e.condition})` : ''}`))
      lines.push('')
    }
    if (architecture.entitySchema?.length) {
      lines.push('## Entity Schema', '')
      architecture.entitySchema.forEach((e) => lines.push(`- \`${e.entity}\` · ${e.type}${e.required ? ' · required' : ''}`))
      lines.push('')
    }
    if (architecture.toneGuide?.length) {
      lines.push('## Tone Guide', '')
      architecture.toneGuide.forEach((t) => lines.push(`- ${t}`))
      lines.push('')
    }
    return lines.join('\n')
  }

  function copyMarkdown() {
    navigator.clipboard.writeText(exportMarkdown())
  }

  function downloadMarkdown() {
    const blob = new Blob([exportMarkdown()], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'conversation-architecture.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="design-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0C12', overflow: 'hidden', fontFamily: 'var(--arc-font)', color: 'var(--arc-text)', position: 'relative' }}>

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(108,99,255,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '256px 256px', opacity: 0.022, pointerEvents: 'none', zIndex: 0 }} />

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, borderBottom: '1px solid rgba(108,99,255,0.1)', background: 'rgba(10,12,18,0.9)', backdropFilter: 'blur(16px)', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ArcMark size={22} />
          <span style={{ fontSize: 15, fontWeight: 500, color: '#F0F2F8', letterSpacing: -0.3 }}>Arc</span>
        </button>
        <div className="design-nav-pills" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {PILL_LABELS.map((label, i) => {
            const ps = pillState(i)
            return (
              <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, fontFamily: 'var(--arc-mono)', background: ps === 'done' ? 'rgba(108,99,255,0.12)' : ps === 'active' ? '#6C63FF' : 'transparent', color: ps === 'done' ? '#A5A0FF' : ps === 'active' ? '#fff' : '#555', border: ps === 'done' ? '1px solid rgba(108,99,255,0.3)' : ps === 'active' ? '1px solid #6C63FF' : '1px solid rgba(240,242,248,0.07)' }}>
                {label}
              </span>
            )
          })}
        </div>
        <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--arc-mono)' }}>
          {turnNumber > 0 ? `turn ${turnNumber}` : 'ready'}
        </span>
      </nav>

      <div className="design-main">
        <div className="design-mobile-or-strip">
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: STATE_GLOW[oriState], borderRadius: 12, transition: 'background 0.8s ease', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: `inset 0 0 24px ${STATE_RING[oriState]}`, transition: 'box-shadow 0.8s ease', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <OriAvatar state={oriState} size={80} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: STATE_LABEL_COLOR[oriState], textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontFamily: 'var(--arc-mono)' }}>
              {sessionStarted ? oriState : 'ready'}
            </span>
            {sessionStarted && (
              <div style={{ height: 3, width: '100%', maxWidth: 200, background: 'rgba(108,99,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: `linear-gradient(90deg, #6C63FF, ${currentProgressColor})`, borderRadius: 2, transition: 'width 0.8s ease, background 0.5s ease' }} />
              </div>
            )}
          </div>
        </div>

        <div className="design-chat-col" style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(108,99,255,0.08)', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(108,99,255,0.08)', fontSize: 10, color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: 'var(--arc-mono)', flexShrink: 0 }}>
            Conversation
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!sessionStarted && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, textAlign: 'center', padding: '0 24px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArcMark size={22} />
                </div>
                <div>
                  <p style={{ color: 'rgba(228,232,242,0.85)', fontSize: 14, lineHeight: 1.65, maxWidth: 260, margin: '0 0 6px' }}>
                    Ori will interview you about your product and build your conversation architecture in real time.
                  </p>
                  <p style={{ color: '#555', fontSize: 11, fontFamily: 'var(--arc-mono)', margin: 0 }}>
                    One question per turn.
                  </p>
                </div>
                <button
                  onClick={startSession}
                  style={{ background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 13, fontFamily: 'var(--arc-font)', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 20px rgba(108,99,255,0.35)', letterSpacing: -0.2 }}
                >
                  Meet Ori
                </button>
              </div>
            )}

            {displayMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: msg.role === 'assistant' ? '#6C63FF' : 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: msg.role === 'assistant' ? '#fff' : '#A5A0FF', flexShrink: 0, border: msg.role === 'user' ? '1px solid rgba(108,99,255,0.2)' : 'none' }}>
                  {msg.role === 'assistant' ? 'O' : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="3.5" r="2" fill="#A5A0FF"/>
                      <path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#A5A0FF" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, padding: '9px 13px', borderRadius: msg.role === 'assistant' ? '2px 10px 10px 10px' : '10px 2px 10px 10px', maxWidth: '82%', color: 'rgba(228,232,242,0.95)', background: msg.role === 'assistant' ? 'rgba(28,35,51,0.85)' : 'rgba(108,99,255,0.1)', borderLeft: msg.role === 'assistant' ? '2px solid #6C63FF' : 'none', border: msg.role === 'user' ? '1px solid rgba(108,99,255,0.2)' : undefined, backdropFilter: 'blur(8px)' }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0 }}>O</div>
                <div style={{ padding: '10px 14px', background: 'rgba(28,35,51,0.85)', borderLeft: '2px solid #6C63FF', borderRadius: '2px 10px 10px 10px', display: 'flex', gap: 4, alignItems: 'center', backdropFilter: 'blur(8px)' }}>
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#A5A0FF', animation: 'blink 1.2s infinite', animationDelay: `${d * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {sessionComplete && (
              <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
                  <p style={{ fontSize: 12, color: '#34D399', margin: 0, fontWeight: 500 }}>Architecture complete</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={copyMarkdown}
                    style={{ fontSize: 11, color: '#A5A0FF', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--arc-mono)' }}
                  >
                    Copy markdown
                  </button>
                  <button
                    onClick={downloadMarkdown}
                    style={{ fontSize: 11, color: '#A5A0FF', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--arc-mono)' }}
                  >
                    Download .md
                  </button>
                  {shareUrl && (
                    <a
                      href={shareUrl}
                      style={{ fontSize: 11, color: '#5EEAD4', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 6, padding: '6px 12px', textDecoration: 'none', fontFamily: 'var(--arc-mono)' }}
                    >
                      Share link →
                    </a>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="design-mobile-arch-row">
            <button
              type="button"
              onClick={() => setArchitectureOverlayOpen(true)}
              style={{ width: '100%', fontSize: 11, color: '#A5A0FF', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--arc-mono)' }}
            >
              View architecture
            </button>
          </div>

          <div className="design-composer" style={{ padding: '10px 12px', borderTop: '1px solid rgba(108,99,255,0.08)', display: 'flex', gap: 8, flexShrink: 0, background: 'rgba(10,12,18,0.6)', backdropFilter: 'blur(8px)', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                requestAnimationFrame(resizeComposer)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              rows={1}
              disabled={isLoading || sessionComplete || !sessionStarted}
              placeholder={!sessionStarted ? 'Click Meet Ori to begin...' : sessionComplete ? 'Architecture complete' : 'Reply to Ori...'}
              className="design-composer-textarea"
              style={{ flex: 1, minHeight: 40, maxHeight: 168, background: 'rgba(28,35,51,0.7)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 7, padding: '8px 12px', fontSize: 13, lineHeight: 1.45, color: 'rgba(228,232,242,0.95)', fontFamily: 'var(--arc-font)', outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', opacity: sessionComplete ? 0.5 : 1, resize: 'none', overflowY: 'auto', alignSelf: 'stretch' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(108,99,255,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.12)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(108,99,255,0.15)'; e.target.style.boxShadow = 'none' }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || sessionComplete || !sessionStarted}
              style={{ width: 34, height: 34, background: isLoading || sessionComplete ? 'rgba(108,99,255,0.3)' : '#6C63FF', border: 'none', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading || sessionComplete ? 'default' : 'pointer', flexShrink: 0, transition: 'background 0.2s ease' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6L11 1L6 11L5.5 6.5L1 6Z" fill="white" /></svg>
            </button>
          </div>
        </div>

        <div className="design-or-desktop-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#07090F', borderRight: '1px solid rgba(108,99,255,0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: STATE_GLOW[oriState], transition: 'background 0.8s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 60px ${STATE_RING[oriState]}`, transition: 'box-shadow 0.8s ease', pointerEvents: 'none' }} />

          <span style={{ fontSize: 9, color: STATE_LABEL_COLOR[oriState], textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontFamily: 'var(--arc-mono)', padding: '12px 0 0', position: 'relative', zIndex: 1, transition: 'color 0.4s ease' }}>
            {sessionStarted ? oriState : ''}
          </span>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, position: 'relative', zIndex: 1 }}>
            <OriAvatar state={oriState} size={148} />
          </div>

          <div style={{ padding: '0 12px 14px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 10, color: '#555', fontFamily: 'var(--arc-mono)', margin: '0 0 8px', letterSpacing: '0.06em' }}>Ori</p>
            {sessionStarted && (
              <div style={{ height: 2, width: 120, background: 'rgba(108,99,255,0.1)', borderRadius: 2, overflow: 'hidden', margin: '0 auto' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: `linear-gradient(90deg, #6C63FF, ${currentProgressColor})`, borderRadius: 2, transition: 'width 0.8s ease, background 0.5s ease' }} />
              </div>
            )}
          </div>
        </div>

        <div className="design-arch-desktop-col" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ArchitecturePanel architecture={architecture} progressPercent={progressPercent} />
        </div>
      </div>

      {architectureOverlayOpen && (
        <div
          className="design-arch-overlay-backdrop"
          role="presentation"
          onClick={() => setArchitectureOverlayOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Conversation architecture"
            className="design-arch-overlay-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxHeight: '88vh', background: '#0A0C12', borderTopLeftRadius: 14, borderTopRightRadius: 14, border: '1px solid rgba(108,99,255,0.2)', borderBottom: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 -12px 40px rgba(0,0,0,0.45)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(108,99,255,0.1)', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#E4E8F2', fontFamily: 'var(--arc-font)' }}>Architecture</span>
              <button
                type="button"
                onClick={() => setArchitectureOverlayOpen(false)}
                style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', color: '#A5A0FF', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close architecture panel"
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <ArchitecturePanel architecture={architecture} progressPercent={progressPercent} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        @keyframes design-arch-slide-up {
          from { transform: translateY(100%); opacity: 0.85; }
          to { transform: translateY(0); opacity: 1; }
        }
        .design-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 200px 1fr;
          overflow: hidden;
          position: relative;
          z-index: 1;
          min-height: 0;
        }
        .design-mobile-or-strip {
          display: none;
        }
        .design-mobile-arch-row {
          display: none;
          flex-shrink: 0;
          padding: 0 12px 8px;
        }
        @media (max-width: 768px) {
          .design-nav-pills {
            display: none !important;
          }
          .design-main {
            display: flex;
            flex-direction: column;
          }
          .design-mobile-or-strip {
            display: flex !important;
            flex-direction: row;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-bottom: 1px solid rgba(108,99,255,0.12);
            background: #07090F;
            flex-shrink: 0;
          }
          .design-or-desktop-col,
          .design-arch-desktop-col {
            display: none !important;
          }
          .design-chat-col {
            flex: 1;
            min-height: 0;
            border-right: none !important;
          }
          .design-mobile-arch-row {
            display: block !important;
          }
          .design-arch-overlay-panel {
            animation: design-arch-slide-up 0.28s ease-out forwards;
          }
        }
        @media (min-width: 769px) {
          .design-arch-overlay-backdrop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
