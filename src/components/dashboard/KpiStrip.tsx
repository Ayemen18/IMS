import { Icon } from '../primitives/Icon'
import type { IconName } from '../../types/role'

export interface Kpi {
  label: string
  value: string
  /** Optional delta string like "+12" or "-0.6d" */
  delta?: string
  deltaTone?: 'green' | 'amber' | 'red'
  /** Percent for the progress bar at the bottom (0–100) */
  progress?: number
  progressTone?: 'green' | 'amber' | 'red' | 'neutral'
  icon?: IconName
}

const TONE_TEXT = {
  green: 'text-signal-green',
  amber: 'text-signal-amber',
  red:   'text-signal-red',
}
const TONE_BAR = {
  green:   'bg-signal-green',
  amber:   'bg-signal-amber',
  red:     'bg-signal-red',
  neutral: 'bg-ink-900 dark:bg-ink-50',
}

const borderToneMap: Record<string, string> = {
  green:   'border-l-signal-green/60',
  amber:   'border-l-signal-amber/60',
  red:     'border-l-signal-red/60',
  neutral: 'border-l-accent-500/60',
}

export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
      {kpis.map((k, i) => (
        <div key={i} className={`bg-white dark:bg-ink-900 py-5 pr-5 pl-4 border-l-[3px] border-solid ${borderToneMap[k.deltaTone ?? 'neutral']}`}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
              {k.label}
            </div>
            {k.icon && <Icon name={k.icon} className="w-3.5 h-3.5 text-ink-400 dark:text-ink-500" />}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-display text-[40px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
              {k.value}
            </div>
            {k.delta && k.deltaTone && (
              <div className={`text-[11px] font-mono ${TONE_TEXT[k.deltaTone]}`}>{k.delta}</div>
            )}
          </div>
          {typeof k.progress === 'number' && (
            <div className="mt-4 h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${TONE_BAR[k.progressTone ?? 'neutral']} transition-all`}
                style={{ width: `${Math.max(0, Math.min(100, k.progress))}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
