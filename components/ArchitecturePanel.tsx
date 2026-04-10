'use client'

import ArchCard from './ArchCard'
import { ArchitectureDelta } from '@/lib/types'

interface ArchitecturePanelProps {
  architecture: ArchitectureDelta
  progressPercent: number
}

export default function ArchitecturePanel({
  architecture,
  progressPercent,
}: ArchitecturePanelProps) {
  const sectionsComplete = [
    architecture.intentTaxonomy && architecture.intentTaxonomy.length > 0,
    architecture.escalationFlow && architecture.escalationFlow.length > 0,
    architecture.entitySchema && architecture.entitySchema.length > 0,
    architecture.toneGuide && architecture.toneGuide.length > 0,
  ].filter(Boolean).length

  const clampedProgress = Math.min(100, Math.max(0, progressPercent))
  const isComplete = sectionsComplete === 4

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--arc-surface)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--arc-border-soft)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--arc-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--arc-mono)',
          }}
        >
          Your conversation architecture
        </span>
      </div>

      <div
        style={{
          flex: 1,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
        }}
      >
        <ArchCard
          type="intent"
          populated={!!(architecture.intentTaxonomy && architecture.intentTaxonomy.length > 0)}
          data={architecture.intentTaxonomy}
        />
        <ArchCard
          type="escalation"
          populated={!!(architecture.escalationFlow && architecture.escalationFlow.length > 0)}
          data={architecture.escalationFlow}
        />
        <ArchCard
          type="entity"
          populated={!!(architecture.entitySchema && architecture.entitySchema.length > 0)}
          data={architecture.entitySchema}
        />
        <ArchCard
          type="tone"
          populated={!!(architecture.toneGuide && architecture.toneGuide.length > 0)}
          data={architecture.toneGuide}
        />
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--arc-border-soft)',
          flexShrink: 0,
        }}
      >
        {isComplete ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--arc-success)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: 'var(--arc-success)',
                fontFamily: 'var(--arc-mono)',
                fontWeight: 500,
              }}
            >
              Architecture complete
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              fontFamily: 'var(--arc-mono)',
              color: 'var(--arc-muted)',
              marginBottom: 6,
            }}
          >
            <span>Architecture</span>
            <span style={{ color: '#A5A0FF' }}>
              {sectionsComplete} of 4 sections
            </span>
          </div>
        )}

        <div
          style={{
            height: 3,
            background: 'rgba(108,99,255,0.12)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${clampedProgress}%`,
              background: isComplete ? 'var(--arc-success)' : 'var(--arc-violet)',
              borderRadius: 2,
              transition: 'width 0.8s ease, background 0.4s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
