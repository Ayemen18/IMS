import { useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, filterToInspectorInspections } from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import type { InspectionDomain } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

export function DraftsPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { user } = useSession()
  const { inspections } = useInspections()
  const { getById } = useTemplates()

  const drafts = useMemo(() => {
    const my = filterToInspectorInspections(inspections.filter(i => i.domain === domain), user)
    return my
      .filter((i) => i.status === 'in_progress')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [inspections, user, domain])

  const oldestStarted = useMemo(() => {
    if (drafts.length === 0) return null
    let oldest = drafts[0]
    for (const d of drafts) {
      const tsA = new Date(oldest.startedAt || oldest.updatedAt).getTime()
      const tsB = new Date(d.startedAt || d.updatedAt).getTime()
      if (tsB < tsA) oldest = d
    }
    return oldest.startedAt || oldest.updatedAt
  }, [drafts])

  return (
    <div className="space-y-6">
      <PageBanner
        title={`Your drafts`}
        subline={`${drafts.length} drafts in progress${ oldestStarted ? ` · oldest started ${formatRelativeTime(oldestStarted)}` : '' }`}
      />

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-text-secondary/15 rounded-2xl py-32 text-center bg-white shadow-soft">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4 text-text-secondary">
            <Icon name="check" className="w-6 h-6" />
          </div>
          <h2 className="text-[16px] font-semibold text-text-primary mb-1">
            No drafts in progress.
          </h2>
          <p className="text-[13px] text-text-secondary mb-6 max-w-[360px] mx-auto">
            When you start an inspection but don't submit it, it will wait here for you.
          </p>
          <button
            onClick={() => nav.push(prefix)}
            className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-secondary hover:bg-accent-light transition-colors"
          >
            View My day
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => {
            const tpl = getById(draft.templateId)
            let totalItems = 0
            if (tpl && tpl.sections) {
              totalItems = tpl.sections.reduce((acc, sec) => acc + sec.items.length, 0)
            } else {
              totalItems = draft.responses.length > 0 ? draft.responses.length : 1
            }

            const answeredItems = draft.responses.filter(
              (r) => r.answer !== null || (r.textAnswer && r.textAnswer.trim().length > 0)
            ).length

            const pct = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0
            const clampedPct = Math.min(100, Math.max(0, pct))

            return (
              <div
                key={draft.id}
                className="flex flex-col rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="font-mono text-[11px] text-text-secondary mb-2">
                    {draft.number}
                  </div>
                  <h3 className="text-[15px] font-semibold text-text-primary leading-snug line-clamp-2 mb-1">
                    {draft.templateName}
                  </h3>
                  <div className="text-[13px] text-text-secondary mb-6">
                    {draft.siteName} {draft.area && `· ${draft.area}`}
                  </div>

                  <div className="mt-auto">
                    <div className="h-1.5 w-full bg-accent-light rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-status-pass rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${clampedPct}%` }}
                      />
                    </div>
                    <div className="font-mono text-[11px] text-text-secondary mb-6">
                      {answeredItems} of {totalItems} items · {clampedPct}% complete
                    </div>
                    
                    <button
                      onClick={() => nav.push(`${prefix}/inspections/${draft.id}`)}
                      className="w-full py-2 rounded-lg bg-primary hover:bg-primary text-white text-[13px] font-bold transition shadow-sm"
                    >
                      Continue
                    </button>
                    <div className="font-mono text-[10px] text-center text-text-secondary mt-3">
                      Last saved {formatRelativeTime(draft.updatedAt)}
                    </div>
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
