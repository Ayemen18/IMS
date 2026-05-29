import { useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, filterToInspectorInspections, formatDate } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import type { InspectionDomain } from '../../../types/inspection'

export function ReturnedPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { user } = useSession()
  const { inspections } = useInspections()

  const returned = useMemo(() => {
    const my = filterToInspectorInspections(inspections.filter(i => i.domain === domain), user)
    return my
      .filter((i) => i.status === 'rejected')
      .sort((a, b) => new Date(b.reviewedAt || b.updatedAt).getTime() - new Date(a.reviewedAt || a.updatedAt).getTime())
  }, [inspections, user])

  const oldest = useMemo(() => {
    if (returned.length === 0) return null
    let o = returned[0]
    for (const r of returned) {
      const tsA = new Date(o.reviewedAt || o.updatedAt).getTime()
      const tsB = new Date(r.reviewedAt || r.updatedAt).getTime()
      if (tsB < tsA) o = r
    }
    return o.reviewedAt || o.updatedAt
  }, [returned])

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-32 animate-fade-in">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-3">
          <span>{domain === 'safety' ? 'Safety Inspector' : 'Quality Inspector'}</span>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">Returned</span>
        </div>
        <h1 className="font-display text-4xl text-ink-900 dark:text-ink-50 tracking-tight mb-2">
          Returned for <span className="italic text-ink-500 dark:text-ink-400">rework</span>.
        </h1>
        <p className="text-[14px] text-ink-600 dark:text-ink-300">
          {returned.length} inspections returned
          {oldest && ` · oldest is ${formatRelativeTime(oldest).replace(' ago', '')} old`}
        </p>
      </div>

      {returned.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full border hairline border-dashed flex items-center justify-center mb-6">
            <Icon name="check" className="w-8 h-8 text-signal-green" />
          </div>
          <h2 className="text-[18px] font-medium text-ink-900 dark:text-ink-50 mb-2">
            Nothing returned.
          </h2>
          <p className="text-[14px] text-ink-500 dark:text-ink-400 max-w-sm text-balance">
            When a manager sends an inspection back for rework, it'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {returned.map((inspection) => {
            const rejectEvent = inspection.timeline.find(e => e.action === 'rejected')

            return (
              <div
                key={inspection.id}
                className="rounded-xl border hairline border-l-4 border-l-signal-amber bg-white dark:bg-ink-900 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 text-[12px] text-ink-500 mb-3">
                    <span className="font-mono">{inspection.number}</span>
                    <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700" />
                    <span>{inspection.scheduledFor ? formatDate(inspection.scheduledFor) : 'Unscheduled'}</span>
                  </div>
                  
                  <h2 className="font-display text-2xl text-ink-900 dark:text-ink-50 mb-6">
                    {inspection.templateName}
                  </h2>

                  <div className="pl-4 py-1 border-l-2 border-ink-300 dark:border-ink-600 mb-8">
                    <p className="font-display italic text-[20px] text-ink-700 dark:text-ink-200 leading-snug">
                      {rejectEvent?.note ? `"${rejectEvent.note}"` : "(No specific feedback — please review and resubmit.)"}
                    </p>
                    <div className="font-mono text-[11px] text-ink-500 mt-3 flex items-center gap-2">
                      <span className="text-ink-700 dark:text-ink-300">{rejectEvent?.byName || inspection.managerName || 'Manager'}</span>
                      <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700" />
                      <span>{formatRelativeTime(rejectEvent?.at || inspection.reviewedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                      className="px-5 py-2.5 rounded-lg bg-accent-500 text-white text-[14px] font-medium hover:bg-accent-600 transition-colors"
                    >
                      Resume editing
                    </button>
                    <button
                      onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                      className="px-5 py-2.5 rounded-lg border hairline bg-transparent text-[14px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      View original submission
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
