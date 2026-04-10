'use client'

interface IntentCard {
  type: 'intent'
  data?: string[]
}

interface EscalationCard {
  type: 'escalation'
  data?: { trigger: string; destination: string; condition?: string }[]
}

interface EntityCard {
  type: 'entity'
  data?: { entity: string; type: string; required: boolean }[]
}

interface ToneCard {
  type: 'tone'
  data?: string[]
}

type ArchCardProps = (IntentCard | EscalationCard | EntityCard | ToneCard) & {
  populated: boolean
}

const LABELS: Record<string, string> = {
  intent: 'Intent taxonomy',
  escalation: 'Escalation flow',
  entity: 'Entity schema',
  tone: 'Tone guide',
}

export default function ArchCard(props: ArchCardProps) {
  const { type, populated } = props

  const cardStyle: React.CSSProperties = {
    background: '#0A0D13',
    border: populated
      ? '1px solid rgba(108,99,255,0.15)'
      : '1px solid rgba(240,242,248,0.06)',
    borderLeft: populated
      ? '2px solid #6C63FF'
      : '1px solid rgba(240,242,248,0.06)',
    borderRadius: populated ? '2px 8px 8px 2px' : 8,
    padding: '12px 14px',
    opacity: populated ? 1 : 0.45,
    transition: 'opacity 0.4s ease, border 0.4s ease',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontFamily: 'var(--arc-mono)',
    marginBottom: 8,
    color: populated ? '#A5A0FF' : '#6B7280',
  }

  const waitStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#444',
    fontStyle: 'italic',
  }

  function renderContent() {
    if (!populated) {
      return <p style={waitStyle}>Waiting for your answer...</p>
    }

    if (props.type === 'intent' && props.data) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {props.data.map((intent, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                background: 'rgba(108,99,255,0.1)',
                color: '#8880CC',
                border: '1px solid rgba(108,99,255,0.18)',
                borderRadius: 3,
                padding: '2px 7px',
                fontFamily: 'var(--arc-mono)',
              }}
            >
              {intent}
            </span>
          ))}
        </div>
      )
    }

    if (props.type === 'escalation' && props.data) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {props.data.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: '#C0BDED',
              }}
            >
              <span style={{ flex: 1 }}>{row.trigger}</span>
              <span style={{ color: '#6C63FF', fontSize: 10 }}>→</span>
              <span
                style={{
                  color: '#A5A0FF',
                  fontFamily: 'var(--arc-mono)',
                  fontSize: 10,
                }}
              >
                {row.destination}
              </span>
            </div>
          ))}
        </div>
      )
    }

    if (props.type === 'entity' && props.data) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {props.data.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: '#C0BDED',
              }}
            >
              <span style={{ flex: 1, fontFamily: 'var(--arc-mono)', fontSize: 10 }}>
                {row.entity}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: '#6B7280',
                  background: 'rgba(108,99,255,0.08)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontFamily: 'var(--arc-mono)',
                }}
              >
                {row.type}
              </span>
              {row.required && (
                <span style={{ fontSize: 9, color: '#6C63FF' }}>req</span>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (props.type === 'tone' && props.data) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {props.data.map((principle, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 7,
                fontSize: 11,
                color: '#C0BDED',
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: '#6C63FF',
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              {principle}
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{LABELS[type]}</div>
      {renderContent()}
    </div>
  )
}
