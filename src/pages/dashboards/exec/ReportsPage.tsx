import { useState, useMemo } from 'react'
import { useInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import type { Inspection } from '../../../types/inspection'

type DomainFilter = 'all' | 'quality' | 'safety'
type DateRange = 'all' | '7d' | '30d' | '1y'

export function ReportsPage() {
  const { inspections } = useInspections()
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [range, setRange] = useState<DateRange>('all')

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const filtered = useMemo(() => {
    return inspections.filter((i: any) => {
      // Must be published (or closed) to be a "report"
      if (i.status !== 'published' && i.status !== 'closed' && i.status !== 'issues_open') return false
      if (!i.publishedAt) return false
      if (domain !== 'all' && i.domain !== domain) return false
      
      if (range !== 'all') {
        const publishedTime = new Date(i.publishedAt).getTime()
        const daysAgo = (Date.now() - publishedTime) / 86400000
        if (range === '7d' && daysAgo > 7) return false
        if (range === '30d' && daysAgo > 30) return false
        if (range === '1y') {
          const currentYear = new Date().getFullYear()
          const reportYear = new Date(i.publishedAt).getFullYear()
          if (reportYear !== currentYear) return false
        }
      }
      return true
    })
  }, [inspections, domain, range])

  // Group by month
  const groups = useMemo(() => {
    const map = new Map<string, Inspection[]>()
    
    // Sort newest first
    const sorted = [...filtered].sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())

    sorted.forEach(i => {
      const d = new Date(i.publishedAt!)
      const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
      if (!map.has(monthKey)) map.set(monthKey, [])
      map.get(monthKey)!.push(i)
    })

    return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
  }, [filtered])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 mb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 uppercase tracking-widest">
            Top Management {'>'} Reports
          </div>
          <div>
            <h1 className="font-display text-[40px] leading-tight text-ink-900 dark:text-ink-50">
              Published <span className="italic">reports</span>.
            </h1>
            <p className="text-[14px] text-ink-500 dark:text-ink-400 mt-2 font-mono">
              {filtered.length} reports published · last refreshed {timeStr}
            </p>
          </div>
        </div>

        <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-md">
          {(['all', 'quality', 'safety'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded capitalize transition-colors ${
                domain === d 
                  ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20' 
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="flex items-center gap-2">
        <FilterChip label="All time" active={range === 'all'} onClick={() => setRange('all')} />
        <FilterChip label="Last 7 days" active={range === '7d'} onClick={() => setRange('7d')} />
        <FilterChip label="Last 30 days" active={range === '30d'} onClick={() => setRange('30d')} />
        <FilterChip label="This year" active={range === '1y'} onClick={() => setRange('1y')} />
      </div>

      {/* List */}
      <div className="space-y-8">
        {groups.length === 0 ? (
          <div className="bg-white dark:bg-ink-950 border hairline rounded-lg p-12 text-center text-[13px] text-ink-500 dark:text-ink-400">
            No reports yet. Reports appear here when inspections complete the full review-verify-publish lifecycle.
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="space-y-3">
              <h2 className="text-[12px] font-mono text-ink-500 dark:text-ink-400 uppercase tracking-widest pl-2">
                {group.label}
              </h2>
              <div className="bg-white dark:bg-ink-950 border hairline rounded-lg overflow-hidden divide-y hairline">
                {group.items.map(insp => {
                  const pubDate = new Date(insp.publishedAt!)
                  return (
                    <div key={insp.id} className="p-4 flex items-center hover:bg-ink-50 dark:hover:bg-ink-900/20 transition-colors group">
                      {/* Date */}
                      <div className="w-24 shrink-0 space-y-0.5">
                        <div className="font-mono text-[13px] text-ink-900 dark:text-ink-50">
                          {pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="font-mono text-[10px] text-ink-500 dark:text-ink-400">
                          {pubDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 pr-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">{insp.number}</span>
                          <span className="text-[14px] font-medium text-ink-900 dark:text-ink-50 truncate">{insp.templateName}</span>
                        </div>
                        <div className="text-[13px] text-ink-500 dark:text-ink-400 mt-1 truncate">
                          {insp.siteName} {insp.area && `· ${insp.area}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 rounded transition-colors">
                          <Icon name="download" className="w-3.5 h-3.5" />
                          Export PDF
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-accent-500 dark:text-ink-900 hover:bg-accent-600 rounded transition-colors">
                          View report
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
        active
          ? 'bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900 border-transparent'
          : 'bg-white dark:bg-ink-950 text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700'
      }`}
    >
      {label}
    </button>
  )
}
