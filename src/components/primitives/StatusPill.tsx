import type { ReactNode } from 'react'

interface StatusPillProps {
  children: ReactNode
  tone?: string
}

const TONE_MAP: Record<string, string> = {
  pass:    'bg-status-pass/10 text-status-pass ring-1 ring-status-pass/20',
  fail:    'bg-status-fail/10 text-status-fail ring-1 ring-status-fail/20',
  warning: 'bg-warning/15 text-text-primary ring-1 ring-warning/30',
  info:    'bg-primary/10 text-primary ring-1 ring-primary/20',
  neutral: 'bg-text-secondary/10 text-text-secondary ring-1 ring-text-secondary/20',
}

export function getStatusTone(status: string): string {
  const s = status.toLowerCase()
  if (['approved', 'published', 'verified', 'closed', 'pass', 'green'].includes(s)) return 'pass'
  if (['rejected', 'fail', 'red'].includes(s)) return 'fail'
  if (['submitted', 'under_review', 'issues_open', 'awaiting', 'amber', 'yellow', 'warning'].includes(s)) return 'warning'
  if (['scheduled', 'in_progress', 'draft', 'live', 'info', 'blue'].includes(s)) return 'info'
  return 'neutral'
}

export function StatusPill({ children, tone }: StatusPillProps) {
  // If a tone is explicitly passed, try to use it or resolve it. Otherwise, infer from children content
  const toneKey = tone || (typeof children === 'string' ? children : 'neutral')
  const resolvedTone = TONE_MAP[toneKey] ? toneKey : getStatusTone(toneKey)
  const mappedClasses = TONE_MAP[resolvedTone] || TONE_MAP.neutral

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${mappedClasses}`}
    >
      {children}
    </span>
  )
}
