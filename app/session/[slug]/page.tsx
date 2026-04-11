import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ArchitectureDelta } from '@/lib/types'

interface SessionPageProps {
  params: Promise<{ slug: string }>
}

async function getSession(slug: string) {
  const { data, error } = await supabase
    .from('arc_sessions')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return data
}

function IntentSection({ data }: { data: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {data.map((intent, i) => (
        <span
          key={i}
          style={{
            fontSize: 12,
            background: 'rgba(108,99,255,0.1)',
            color: '#A5A0FF',
            border: '1px solid rgba(108,99,255,0.2)',
            borderRadius: 4,
            padding: '3px 10px',
            fontFamily: 'var(--arc-mono)',
          }}
        >
          {intent}
        </span>
      ))}
    </div>
  )
}

function EscalationSection({
  data,
}: {
  data: { trigger: string; destination: string; condition?: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#C0BDED',
            padding: '8px 12px',
            background: 'rgba(108,99,255,0.05)',
            borderRadius: 6,
          }}
        >
          <span style={{ flex: 1 }}>{row.trigger}</span>
          <span style={{ color: '#6C63FF', fontSize: 12 }}>→</span>
          <span
            style={{
              color: '#A5A0FF',
              fontFamily: 'var(--arc-mono)',
              fontSize: 12,
            }}
          >
            {row.destination}
          </span>
        </div>
      ))}
    </div>
  )
}

function EntitySection({
  data,
}: {
  data: { entity: string; type: string; required: boolean }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#C0BDED',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--arc-mono)',
              fontSize: 12,
              flex: 1,
            }}
          >
            {row.entity}
          </span>
          <span
            style={{
              fontSize: 10,
              color: '#6B7280',
              background: 'rgba(108,99,255,0.08)',
              padding: '2px 7px',
              borderRadius: 3,
              fontFamily: 'var(--arc-mono)',
            }}
          >
            {row.type}
          </span>
          {row.required && (
            <span style={{ fontSize: 10, color: '#6C63FF' }}>required</span>
          )}
        </div>
      ))}
    </div>
  )
}

function ToneSection({ data }: { data: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((principle, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: 13,
            color: '#C0BDED',
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#6C63FF',
              flexShrink: 0,
              marginTop: 6,
            }}
          />
          {principle}
        </div>
      ))}
    </div>
  )
}

function ArchSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#161B27',
        border: '1px solid rgba(108,99,255,0.12)',
        borderLeft: '2px solid #6C63FF',
        borderRadius: '2px 10px 10px 2px',
        padding: '20px 24px',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'var(--arc-mono)',
          color: '#A5A0FF',
          marginBottom: 14,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { slug } = await params
  const session = await getSession(slug)
  if (!session) notFound()

  const arch: ArchitectureDelta = session.architecture || {}
  const createdAt = new Date(session.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
          height: 52,
          borderBottom: '1px solid rgba(108,99,255,0.08)',
          position: 'sticky',
          top: 0,
          background: 'var(--arc-bg)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 14,
              height: 14,
              background: '#6C63FF',
              transform: 'rotate(45deg)',
              borderRadius: 2,
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3 }}>
            Arc
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            color: '#6B7280',
            fontFamily: 'var(--arc-mono)',
          }}
        >
          conversation architecture
        </span>
        <a
          href="/design"
          style={{
            fontSize: 12,
            color: '#A5A0FF',
            border: '1px solid rgba(108,99,255,0.3)',
            padding: '5px 14px',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          Start your own
        </a>
      </nav>

      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 10,
              color: '#6B7280',
              fontFamily: 'var(--arc-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Built with Arc by Ori · {createdAt}
          </p>
          <h1
            style={{
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 500,
              letterSpacing: -0.6,
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Conversation Architecture
          </h1>
          {session.product_description && (
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              For: {session.product_description}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 48,
          }}
        >
          {arch.intentTaxonomy && arch.intentTaxonomy.length > 0 && (
            <ArchSection label="Intent taxonomy">
              <IntentSection data={arch.intentTaxonomy} />
            </ArchSection>
          )}
          {arch.escalationFlow && arch.escalationFlow.length > 0 && (
            <ArchSection label="Escalation flow">
              <EscalationSection data={arch.escalationFlow} />
            </ArchSection>
          )}
          {arch.entitySchema && arch.entitySchema.length > 0 && (
            <ArchSection label="Entity schema">
              <EntitySection data={arch.entitySchema} />
            </ArchSection>
          )}
          {arch.toneGuide && arch.toneGuide.length > 0 && (
            <ArchSection label="Tone guide">
              <ToneSection data={arch.toneGuide} />
            </ArchSection>
          )}
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(108,99,255,0.08)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: '#444',
              lineHeight: 1.6,
              maxWidth: 480,
            }}
          >
            This architecture was generated by Ori, Arc&apos;s conversation design
            agent. Use it as a starting point, not a final spec.
          </p>
          <a
            href="/design"
            style={{
              fontSize: 12,
              color: '#A5A0FF',
              textDecoration: 'none',
              fontFamily: 'var(--arc-mono)',
              flexShrink: 0,
            }}
          >
            Build yours →
          </a>
        </div>
      </main>
    </div>
  )
}
