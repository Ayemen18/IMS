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

const accentColorMap: Record<string, string> = {
  green:   'bg-status-pass',
  amber:   'bg-warning',
  red:     'bg-status-fail',
  neutral: 'bg-primary',
}

const deltaTextColorMap: Record<string, string> = {
  green:   'text-status-pass',
  amber:   'text-warning',
  red:     'text-status-fail',
  neutral: 'text-text-secondary',
}

const progressColorMap: Record<string, string> = {
  green:   'bg-status-pass',
  amber:   'bg-warning',
  red:     'bg-status-fail',
  neutral: 'bg-primary',
}

export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k, i) => {
        const tone = k.deltaTone ?? 'neutral'
        const barTone = k.progressTone ?? tone
        const accentColor = accentColorMap[tone] || accentColorMap.neutral
        const deltaColor = deltaTextColorMap[tone] || deltaTextColorMap.neutral
        const progressColor = progressColorMap[barTone] || progressColorMap.neutral

        return (
          <div
            key={i}
            className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-5 lg:p-6 overflow-hidden hover:shadow-lift transition-shadow"
          >
            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} aria-hidden="true" />
            
            <div className="pl-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary truncate">
                  {k.label}
                </div>
                {k.icon && <Icon name={k.icon} className="w-3.5 h-3.5 text-text-secondary" />}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="font-sans text-[36px] font-bold leading-none tracking-tight text-text-primary">
                  {k.value}
                </div>
                {k.delta && (
                  <div className={`text-[13px] font-mono font-bold inline-flex items-center gap-1 ${deltaColor}`}>
                    <span aria-hidden="true">{k.delta.startsWith('+') ? '▲' : '▼'}</span>
                    {k.delta}
                  </div>
                )}
              </div>
              {typeof k.progress === 'number' && (
                <div className="mt-4 h-1.5 bg-accent-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressColor} transition-all`}
                    style={{ width: `${Math.max(0, Math.min(100, k.progress))}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
