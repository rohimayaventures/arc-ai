export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--arc-bg)',
      fontFamily: 'var(--arc-font)',
      color: 'var(--arc-text)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: 20, 
          height: 20, 
          background: 'var(--arc-violet)', 
          transform: 'rotate(45deg)', 
          borderRadius: 3,
          margin: '0 auto 20px'
        }} />
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8, marginBottom: 8 }}>
          Arc
        </h1>
        <p style={{ color: 'var(--arc-muted)', fontSize: 14 }}>
          Conversation design before code.
        </p>
      </div>
    </main>
  )
}
