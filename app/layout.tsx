import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arc — Conversation design before code',
  description: 'Ori interviews you about your product and returns a complete conversation architecture. Intents, escalation flows, entity schema, tone principles.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
