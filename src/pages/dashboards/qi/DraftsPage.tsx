import { useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, filterToInspectorInspections } from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import type { InspectionDomain } from '../../../types/inspection'

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
  }, [inspections, user])

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
    <div className="max-w-[1200px] mx-auto px-6 py-8 pb-32 animate-fade-in">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-3">
          <span>{domain === 'safety' ? 'Safety Inspector' : 'Quality Inspector'}</span>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">Drafts</span>
        </div>
        <h1 className="font-display text-4xl text-ink-900 dark:text-ink-50 tracking-tight mb-2">
          Your <span className="italic text-ink-500 dark:text-ink-400">drafts</span>.
        </h1>
        <p className="text-[14px] text-ink-600 dark:text-ink-300">
          {drafts.length} drafts in progress
          {oldestStarted && ` · oldest started ${formatRelativeTime(oldestStarted)}`}
        </p>
      </div>

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full border hairline border-dashed flex items-center justify-center mb-6">
            <Icon name="check" className="w-8 h-8 text-ink-300 dark:text-ink-600" />
          </div>
          <h2 className="text-[18px] font-medium text-ink-900 dark:text-ink-50 mb-2">
            No drafts in progress.
          </h2>
          <p className="text-[14px] text-ink-500 dark:text-ink-400 mb-6 max-w-sm text-balance">
            When you start an inspection but don't submit it, it'll wait here for you.
          </p>
          <button
            onClick={() => nav.push(prefix)}
            className="px-5 py-2.5 rounded-lg border hairline bg-white dark:bg-ink-900 text-[14px] font-medium text-ink-900 dark:text-ink-50 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
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
                className="flex flex-col rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] hover:-translate-y-[1px]"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="font-mono text-[11px] text-ink-500 mb-2">
                    {draft.number}
                  </div>
                  <h3 className="text-[16px] font-medium text-ink-900 dark:text-ink-50 leading-snug line-clamp-2 mb-1">
                    {draft.templateName}
                  </h3>
                  <div className="text-[13px] text-ink-500 dark:text-ink-400 mb-8">
                    {draft.siteName} {draft.area && `· ${draft.area}`}
                  </div>

                  <div className="mt-auto">
                    <div className="h-2 w-full bg-ink-200 dark:bg-ink-700 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-signal-green rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${clampedPct}%` }}
                      />
                    </div>
                    <div className="font-mono text-[11px] text-ink-600 dark:text-ink-300 mb-6">
                      {answeredItems} of {totalItems} items · {clampedPct}% complete
                    </div>
                    
                    <button
                      onClick={() => nav.push(`${prefix}/inspections/${draft.id}`)}
                      className="w-full py-2.5 rounded-lg bg-accent-500 text-white text-[14px] font-medium hover:bg-accent-600 transition-colors"
                    >
                      Continue
                    </button>
                    <div className="font-mono text-[10px] text-center text-ink-400 dark:text-ink-500 mt-3">
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
