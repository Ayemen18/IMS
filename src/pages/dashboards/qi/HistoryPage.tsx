import { useState, useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, filterToInspectorInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'

type DateFilter = 'all' | '7d' | '30d' | 'year'

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'year', label: 'This year' },
]

export function HistoryPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { user } = useSession()
  const { inspections } = useInspections()

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const baseHistory = useMemo(() => {
    const my = filterToInspectorInspections(inspections.filter(i => i.domain === domain), user)
    return my.filter((i) => ['approved', 'issues_open', 'issues_closed', 'published'].includes(i.status))
  }, [inspections, user])

  const lastCompleted = useMemo(() => {
    if (baseHistory.length === 0) return null
    let latest = baseHistory[0]
    for (const h of baseHistory) {
      const tsA = new Date(latest.publishedAt || latest.reviewedAt || latest.updatedAt).getTime()
      const tsB = new Date(h.publishedAt || h.reviewedAt || h.updatedAt).getTime()
      if (tsB > tsA) latest = h
    }
    return latest.publishedAt || latest.reviewedAt || latest.updatedAt
  }, [baseHistory])

  const filteredHistory = useMemo(() => {
    let result = baseHistory

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        i =>
          i.templateName.toLowerCase().includes(q) ||
          i.siteName.toLowerCase().includes(q) ||
          (i.area && i.area.toLowerCase().includes(q)) ||
          i.number.toLowerCase().includes(q)
      )
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      if (dateFilter === '7d') {
        const threshold = now.getTime() - 7 * 86_400_000
        result = result.filter(i => new Date(i.publishedAt || i.reviewedAt || i.updatedAt).getTime() >= threshold)
      } else if (dateFilter === '30d') {
        const threshold = now.getTime() - 30 * 86_400_000
        result = result.filter(i => new Date(i.publishedAt || i.reviewedAt || i.updatedAt).getTime() >= threshold)
      } else if (dateFilter === 'year') {
        const currentYear = now.getFullYear()
        result = result.filter(i => new Date(i.publishedAt || i.reviewedAt || i.updatedAt).getFullYear() === currentYear)
      }
    }

    // Sort descending
    result = [...result].sort((a, b) => {
      const ta = new Date(a.publishedAt || a.reviewedAt || a.updatedAt).getTime()
      const tb = new Date(b.publishedAt || b.reviewedAt || b.updatedAt).getTime()
      return tb - ta
    })

    return result
  }, [baseHistory, searchQuery, dateFilter])

  const groupedByMonth = useMemo(() => {
    const groups: { monthStr: string; items: typeof filteredHistory }[] = []
    
    filteredHistory.forEach(item => {
      const date = new Date(item.publishedAt || item.reviewedAt || item.updatedAt)
      const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
      
      let group = groups.find(g => g.monthStr === monthStr)
      if (!group) {
        group = { monthStr, items: [] }
        groups.push(group)
      }
      group.items.push(item)
    })
    
    return groups
  }, [filteredHistory])

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8 pb-32 animate-fade-in">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-3">
          <span>{domain === 'safety' ? 'Safety Inspector' : 'Quality Inspector'}</span>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">History</span>
        </div>
        <h1 className="font-display text-4xl text-ink-900 dark:text-ink-50 tracking-tight mb-2">
          Your <span className="italic text-ink-500 dark:text-ink-400">history</span>.
        </h1>
        <p className="text-[14px] text-ink-600 dark:text-ink-300">
          {baseHistory.length} completed inspections
          {lastCompleted && ` · last one ${formatRelativeTime(lastCompleted).replace('in ', '').replace(' ago', '')} ago.`}
        </p>
      </div>

      {baseHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full border hairline border-dashed flex items-center justify-center mb-6">
            <Icon name="layers" className="w-8 h-8 text-ink-300 dark:text-ink-600" />
          </div>
          <h2 className="text-[18px] font-medium text-ink-900 dark:text-ink-50 mb-2">
            No completed inspections yet.
          </h2>
          <p className="text-[14px] text-ink-500 dark:text-ink-400 max-w-sm text-balance">
            Inspections you've submitted and that have been reviewed will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="relative max-w-2xl">
              <Icon name="search" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search by template, area, site, or number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 rounded-xl border hairline bg-white dark:bg-ink-900 text-[14px] focus-ring shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900 dark:hover:text-ink-50"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DATE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id)}
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-colors ${
                    dateFilter === filter.id
                      ? 'bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900'
                      : 'border hairline text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 bg-white dark:bg-ink-900/50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-20 text-center border hairline border-dashed rounded-xl">
              <h3 className="text-[15px] font-medium text-ink-900 dark:text-ink-50 mb-1">No results found.</h3>
              <p className="text-[14px] text-ink-500">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedByMonth.map(group => (
                <div key={group.monthStr} className="space-y-4">
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink-500 dark:text-ink-400 ml-2">
                    {group.monthStr}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {group.items.map(insp => {
                      const dateObj = new Date(insp.publishedAt || insp.reviewedAt || insp.updatedAt)
                      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      
                      return (
                        <button
                          key={insp.id}
                          onClick={() => nav.push(`${prefix}/inspections/${insp.id}`)}
                          className="w-full text-left group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-xl border hairline bg-white dark:bg-ink-900/50 hover:border-ink-300 dark:hover:border-ink-600 transition-all hover:shadow-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-3 md:mb-0">
                            <div className="w-16 shrink-0 font-mono text-[14px] text-ink-900 dark:text-ink-50 tracking-tight">
                              {dateStr}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-medium text-ink-900 dark:text-ink-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors truncate">
                                {insp.templateName}
                              </h4>
                              <div className="text-[13px] text-ink-500 flex items-center gap-2 mt-1 truncate">
                                <span>{insp.siteName}</span>
                                {insp.area && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-ink-200 dark:bg-ink-700" />
                                    <span>{insp.area}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                            <StatusPill tone={STATUS_TONE[insp.status]}>{STATUS_LABEL[insp.status]}</StatusPill>
                            <div className="w-5 flex justify-end text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">
                              <Icon name="arrow_right" className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
