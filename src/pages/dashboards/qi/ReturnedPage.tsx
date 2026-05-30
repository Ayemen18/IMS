import { useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, filterToInspectorInspections, formatDate } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import type { InspectionDomain } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

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
  }, [inspections, user, domain])

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
    <div className="space-y-6">
      <PageBanner
        title={`Returned for rework`}
        subline={`${returned.length} inspections returned${ oldest ? ` · oldest is ${formatRelativeTime(oldest).replace(' ago', '')} old` : '' }`}
      />

      {returned.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-text-secondary/15 rounded-2xl py-32 text-center bg-white shadow-soft">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4 text-status-pass">
            <Icon name="check" className="w-6 h-6" />
          </div>
          <h2 className="text-[16px] font-semibold text-text-primary mb-1">
            Nothing returned.
          </h2>
          <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto">
            When a manager sends an inspection back for rework, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {returned.map((inspection) => {
            const rejectEvent = inspection.timeline.find(e => e.action === 'rejected')

            return (
              <div
                key={inspection.id}
                className="relative rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft flex flex-col p-6"
              >
                {/* Yellow left accent bar for returned status */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" aria-hidden="true" />
                
                <div className="pl-3">
                  <div className="flex items-center gap-3 text-[12px] text-text-secondary mb-3">
                    <span className="font-mono">{inspection.number}</span>
                    <span className="w-1 h-1 rounded-full bg-accent-light" />
                    <span>{inspection.scheduledFor ? formatDate(inspection.scheduledFor) : 'Unscheduled'}</span>
                  </div>
                  
                  <h2 className="text-[18px] font-bold text-text-primary mb-4">
                    {inspection.templateName}
                  </h2>

                  <div className="pl-4 py-2 border-l-2 border-warning bg-accent-light/50 rounded-r-xl mb-6">
                    <p className="text-[14px] text-text-secondary leading-relaxed font-medium">
                      {rejectEvent?.note ? `"${rejectEvent.note}"` : "(No specific feedback — please review and resubmit.)"}
                    </p>
                    <div className="font-mono text-[11px] text-text-secondary mt-2 flex items-center gap-2">
                      <span className="font-bold text-text-primary">{rejectEvent?.byName || inspection.managerName || 'Manager'}</span>
                      <span className="w-1 h-1 rounded-full bg-accent-light" />
                      <span>{formatRelativeTime(rejectEvent?.at || inspection.reviewedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                      className="px-4 py-2 rounded-lg bg-primary hover:bg-primary text-white text-[13px] font-bold transition shadow-sm"
                    >
                      Resume editing
                    </button>
                    <button
                      onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                      className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors"
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
