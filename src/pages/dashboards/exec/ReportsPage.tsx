import { useState, useMemo } from 'react'
import { useInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { PageBanner } from '../../../components/shell/PageBanner'
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
        Top Management &gt; Reports
      </div>

      {/* Page Banner with nested domain filter */}
      <PageBanner
        title="Published Reports"
        subline={`${filtered.length} reports published · last refreshed ${timeStr}`}
        actions={
          <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
            {(['all', 'quality', 'safety'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${ domain === d ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
              >
                {d}
              </button>
            ))}
          </div>
        }
      />

      {/* Date Range Filters */}
      <div className="flex items-center gap-2">
        <FilterChip label="All time" active={range === 'all'} onClick={() => setRange('all')} />
        <FilterChip label="Last 7 days" active={range === '7d'} onClick={() => setRange('7d')} />
        <FilterChip label="Last 30 days" active={range === '30d'} onClick={() => setRange('30d')} />
        <FilterChip label="This year" active={range === '1y'} onClick={() => setRange('1y')} />
      </div>

      {/* Reports List */}
      <div className="space-y-8">
        {groups.length === 0 ? (
          <div className="bg-white border border-text-secondary/15 rounded-2xl p-12 text-center text-[13px] text-text-secondary shadow-soft">
            No reports yet. Reports appear here when inspections complete the full review-verify-publish lifecycle.
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="space-y-3">
              <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-2">
                {group.label}
              </h2>
              <div className="bg-white border border-text-secondary/15 rounded-2xl overflow-hidden divide-y divide-text-secondary/15 shadow-soft">
                {group.items.map(insp => {
                  const pubDate = new Date(insp.publishedAt!)
                  return (
                    <div key={insp.id} className="p-4 flex items-center hover:bg-accent-light/50 transition-colors group">
                      {/* Date */}
                      <div className="w-24 shrink-0 space-y-0.5">
                        <div className="font-mono text-[13px] text-text-primary font-bold">
                          {pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="font-mono text-[10px] text-text-secondary">
                          {pubDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 pr-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-text-secondary">{insp.number}</span>
                          <span className="text-[13px] font-bold text-text-primary truncate">{insp.templateName}</span>
                        </div>
                        <div className="text-[12px] text-text-secondary mt-0.5 truncate">
                          {insp.siteName} {insp.area && `· ${insp.area}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-text-primary hover:bg-accent-light rounded-lg border border-text-secondary/15 transition-colors">
                          <Icon name="download" className="w-3.5 h-3.5" />
                          Export PDF
                        </button>
                        <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-bold text-white bg-primary hover:bg-primary rounded-lg transition-colors shadow-sm">
                          View Report
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

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border ${ active ? 'bg-primary text-white border-transparent shadow-sm' : 'bg-white text-text-secondary border-text-secondary/15 hover:border-text-secondary/15 hover:text-text-primary' }`}
    >
      {label}
    </button>
  )
}
