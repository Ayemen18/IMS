import { useState, useMemo } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, filterToInspectorInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

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
  }, [inspections, user, domain])

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
    <div className="space-y-6">
      <PageBanner
        title={`Your history`}
        subline={`${baseHistory.length} completed inspections${ lastCompleted ? ` · last one ${formatRelativeTime(lastCompleted).replace('in ', '').replace(' ago', '')} ago.` : '' }`}
      />

      {baseHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-text-secondary/15 rounded-2xl py-32 text-center bg-white shadow-soft">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4">
            <Icon name="layers" className="w-6 h-6 text-text-secondary" />
          </div>
          <h2 className="text-[16px] font-semibold text-text-primary mb-1">
            No completed inspections yet.
          </h2>
          <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto">
            Inspections you have submitted and that have been reviewed will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl">
              {DATE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id)}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition ${ dateFilter === filter.id ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px] max-w-sm">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-text-secondary/15 rounded-lg pl-10 pr-8 py-2 text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Icon name="close" className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-text-secondary/15 rounded-2xl bg-white shadow-soft">
              <h3 className="text-[15px] font-semibold text-text-primary mb-1">No results found.</h3>
              <p className="text-[13px] text-text-secondary">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedByMonth.map(group => (
                <div key={group.monthStr} className="space-y-3">
                  <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-secondary ml-2">
                    {group.monthStr}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.items.map(insp => {
                      const dateObj = new Date(insp.publishedAt || insp.reviewedAt || insp.updatedAt)
                      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      
                      return (
                        <button
                          key={insp.id}
                          onClick={() => nav.push(`${prefix}/inspections/${insp.id}`)}
                          className="w-full text-left group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-text-secondary/15 bg-white hover:bg-accent-light transition shadow-soft hover:shadow-medium"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-3 md:mb-0 min-w-0">
                            <div className="w-16 shrink-0 font-mono text-[13px] text-text-primary font-bold tracking-tight">
                              {dateStr}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[15px] font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                                {insp.templateName}
                              </h4>
                              <div className="text-[12px] text-text-secondary flex items-center gap-2 mt-1 truncate">
                                <span>{insp.siteName}</span>
                                {insp.area && (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-light" />
                                    <span>{insp.area}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                            <StatusPill tone={STATUS_TONE[insp.status]}>{STATUS_LABEL[insp.status]}</StatusPill>
                            <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
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
