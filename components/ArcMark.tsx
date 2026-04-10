export default function ArcMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M4 24 L14 4 L24 24" stroke="#6C63FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 17 Q14 11 20 17" stroke="#A5A0FF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="14" r="1.5" fill="#6C63FF" opacity="0.7" />
    </svg>
  )
}
