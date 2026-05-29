import type { ReactNode } from 'react'

type Tone = 'green' | 'amber' | 'red' | 'neutral'

interface StatusPillProps {
  children: ReactNode
  tone?: Tone
}

const TONE_BG: Record<Tone, string> = {
  green: 'text-signal-green bg-signal-green/10',
  amber: 'text-signal-amber bg-signal-amber/10',
  red: 'text-signal-red bg-signal-red/10',
  neutral: 'text-ink-600 dark:text-ink-300 bg-ink-100 dark:bg-ink-800',
}

const TONE_DOT: Record<Tone, string> = {
  green: 'bg-signal-green',
  amber: 'bg-signal-amber',
  red: 'bg-signal-red',
  neutral: 'bg-ink-400',
}

export function StatusPill({ children, tone = 'green' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${TONE_BG[tone]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[tone]} animate-pulse-dot`} />
      {children}
    </span>
  )
}
