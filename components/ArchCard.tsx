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
  /** First-time fill: brief glow so the section feels “stamped in”. */
  revealPulse?: boolean
}

const CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  intent:    { label: 'Intent taxonomy',  color: '#A5A0FF', bg: 'rgba(108,99,255,0.07)',  border: '#6C63FF' },
  escalation:{ label: 'Escalation flow',  color: '#D4AE78', bg: 'rgba(184,146,74,0.07)', border: '#B8924A' },
  entity:    { label: 'Entity schema',    color: '#5EEAD4', bg: 'rgba(45,212,191,0.06)',  border: '#2DD4BF' },
  tone:      { label: 'Tone guide',       color: '#F9A8D4', bg: 'rgba(244,114,182,0.07)', border: '#F472B6' },
}

export default function ArchCard(props: ArchCardProps) {
  const { type, populated, revealPulse } = props
  const cfg = CONFIG[type]

  return (
    <div
      className={revealPulse ? 'design-arch-reveal-pulse' : undefined}
      style={{
        background: populated ? cfg.bg : 'rgba(10,12,18,0.4)',
        border: populated
          ? `1px solid ${cfg.border}33`
          : '1px solid rgba(240,242,248,0.06)',
        borderLeft: populated ? `2px solid ${cfg.border}` : '1px solid rgba(240,242,248,0.06)',
        borderRadius: populated ? '2px 10px 10px 2px' : 10,
        padding: '14px 16px',
        opacity: populated ? 1 : 0.45,
        transition: 'all 0.5s ease',
        boxShadow: populated ? `0 0 24px ${cfg.border}18` : 'none',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          fontFamily: 'var(--arc-mono)',
          marginBottom: 8,
          color: populated ? cfg.color : '#555',
          transition: 'color 0.4s ease',
        }}
      >
        {cfg.label}
      </div>

      {!populated && (
        <p style={{ fontSize: 11, color: 'rgba(148,156,176,0.72)', fontStyle: 'italic' }}>
          Waiting for your answer...
        </p>
      )}

      {populated && props.type === 'intent' && props.data && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {props.data.map((intent, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                background: `${cfg.border}18`,
                color: cfg.color,
                border: `1px solid ${cfg.border}33`,
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'var(--arc-mono)',
              }}
            >
              {intent}
            </span>
          ))}
        </div>
      )}

      {populated && props.type === 'escalation' && props.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {props.data.map((row, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#C0BDED' }}
            >
              <span style={{ flex: 1 }}>{row.trigger}</span>
              <span style={{ color: cfg.border, fontSize: 10 }}>→</span>
              <span style={{ color: cfg.color, fontFamily: 'var(--arc-mono)', fontSize: 10 }}>
                {row.destination}
              </span>
            </div>
          ))}
        </div>
      )}

      {populated && props.type === 'entity' && props.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {props.data.map((row, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#C0BDED' }}
            >
              <span style={{ flex: 1, fontFamily: 'var(--arc-mono)', fontSize: 10 }}>{row.entity}</span>
              <span
                style={{
                  fontSize: 9,
                  color: '#6B7280',
                  background: `${cfg.border}18`,
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontFamily: 'var(--arc-mono)',
                }}
              >
                {row.type}
              </span>
              {row.required && (
                <span style={{ fontSize: 9, color: cfg.color }}>req</span>
              )}
            </div>
          ))}
        </div>
      )}

      {populated && props.type === 'tone' && props.data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {props.data.map((principle, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: '#D0D4E0', lineHeight: 1.4 }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: cfg.border,
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              {principle}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
