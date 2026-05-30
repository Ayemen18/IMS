import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, formatClockTime, isToday, formatDate } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import { Avatar } from '../../../components/primitives/Avatar'
import type { Inspection, InspectionStatus, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

type SortKey = 'number' | 'template' | 'site' | 'inspector' | 'scheduled' | 'updated' | 'status'
type SortDir = 'asc' | 'desc'

type StatusGroup = 'all' | 'live' | 'review' | 'open' | 'done'

const STATUS_GROUPS: { key: StatusGroup; label: string; matches: (s: InspectionStatus) => boolean }[] = [
  { key: 'all',    label: 'All',        matches: () => true },
  { key: 'live',   label: 'Live',       matches: (s) => s === 'scheduled' || s === 'in_progress' || s === 'on_hold' },
  { key: 'review', label: 'Needs review', matches: (s) => s === 'submitted' || s === 'under_review' || s === 'rejected' },
  { key: 'open',   label: 'Issues open', matches: (s) => s === 'issues_open' },
  { key: 'done',   label: 'Closed',     matches: (s) => s === 'issues_closed' || s === 'published' || s === 'approved' || s === 'cancelled' },
]

export function InspectionsListPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const { inspections: allInspections } = useInspections()
  const inspections = useMemo(() => allInspections.filter(i => i.domain === domain), [allInspections, domain])
  const prefix = domain === 'safety' ? '/sm' : '/qm'

  const [query, setQuery] = useState('')
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('all')
  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [inspectorFilter, setInspectorFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('scheduled')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Available filters from data
  const sites = useMemo(() => {
    const m = new Map<string, string>()
    inspections.forEach((i) => m.set(i.siteId, i.siteName))
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }))
  }, [inspections])

  const inspectors = useMemo(() => {
    const m = new Map<string, string>()
    inspections.forEach((i) => {
      if (i.inspectorId && i.inspectorName) m.set(i.inspectorId, i.inspectorName)
    })
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }))
  }, [inspections])

  // Counts by status group
  const groupCounts = useMemo(() => {
    const obj: Record<StatusGroup, number> = { all: 0, live: 0, review: 0, open: 0, done: 0 }
    inspections.forEach((i) => {
      STATUS_GROUPS.forEach((g) => {
        if (g.matches(i.status)) obj[g.key] += 1
      })
    })
    return obj
  }, [inspections])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (i: Inspection) =>
      !q ||
      i.number.toLowerCase().includes(q) ||
      i.templateName.toLowerCase().includes(q) ||
      (i.area ?? '').toLowerCase().includes(q) ||
      i.siteName.toLowerCase().includes(q) ||
      (i.inspectorName ?? '').toLowerCase().includes(q)
    const matchesStatus = (i: Inspection) =>
      STATUS_GROUPS.find((g) => g.key === statusGroup)!.matches(i.status)
    const matchesSite = (i: Inspection) => siteFilter === 'all' || i.siteId === siteFilter
    const matchesInspector = (i: Inspection) =>
      inspectorFilter === 'all' || i.inspectorId === inspectorFilter

    const result = inspections.filter(
      (i) => matchesQuery(i) && matchesStatus(i) && matchesSite(i) && matchesInspector(i)
    )
    const dir = sortDir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'number':    return a.number.localeCompare(b.number)
          case 'template':  return a.templateName.localeCompare(b.templateName)
          case 'site':      return a.siteName.localeCompare(b.siteName)
          case 'inspector': return (a.inspectorName ?? '').localeCompare(b.inspectorName ?? '')
          case 'scheduled': return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
          case 'updated':   return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          case 'status':    return a.status.localeCompare(b.status)
        }
      })()
      return cmp * dir
    })
    return result
  }, [inspections, query, statusGroup, siteFilter, inspectorFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'number' || key === 'template' || key === 'site' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <PageBanner
        title={`All ${domain === 'safety' ? 'safety' : 'quality'} inspections`}
        subline={`${groupCounts.all} total · ${groupCounts.review} need review · ${groupCounts.open} with open issues`}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => nav.push(`${prefix}/schedule`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              + New inspection
            </button>
          </>
        }
      />

      {/* ============ Filter bar ============ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl">
          {STATUS_GROUPS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusGroup(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition ${ statusGroup === tab.key ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
            >
              {tab.label}
              {groupCounts[tab.key] > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ statusGroup === tab.key ? 'bg-primary/10 text-primary' : 'bg-accent-light text-text-secondary' }`}>
                  {groupCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by number, site..."
              className="w-full bg-white border border-text-secondary/15 rounded-lg pl-10 pr-8 py-2 text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
            {query && (
              <button 
                onClick={() => setQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Clear search"
              >
                <Icon name="close" className="w-3 h-3" />
              </button>
            )}
          </div>

          <FilterSelect value={siteFilter} onChange={setSiteFilter} options={[{ value: 'all', label: 'All sites' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]} />
          <FilterSelect value={inspectorFilter} onChange={setInspectorFilter} options={[{ value: 'all', label: 'All inspectors' }, ...inspectors.map((i) => ({ value: i.id, label: i.name }))]} />
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[100px_2fr_1fr_1fr_1.1fr_1fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
          <SortHeader label="Number"    sortKey="number"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Template"  sortKey="template"  active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Site"      sortKey="site"      active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Inspector" sortKey="inspector" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Scheduled" sortKey="scheduled" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Status"    sortKey="status"    active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasFilters={!!query || statusGroup !== 'all' || siteFilter !== 'all' || inspectorFilter !== 'all'} />
        ) : (
          <div className="divide-y divide-text-secondary/15">
            {filtered.map((i) => (
              <InspectionRow key={i.id} inspection={i} onClick={() => nav.push(`${prefix}/inspections/${i.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-text-secondary/15 flex items-center justify-between text-[12px] text-text-secondary bg-accent-light/50">
            <span>
              Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {inspections.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function SortHeader({
  label, sortKey, active, dir, onClick, align = 'left',
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
  align?: 'left' | 'right'
}) {
  const isActive = active === sortKey
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`${align === 'right' ? 'text-right justify-end' : 'text-left'} text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${ isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary' }`}
    >
      {label}
      {isActive && <Icon name="chevron_down" className={`w-3.5 h-3.5 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />}
    </button>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )
}

function InspectionRow({ inspection, onClick }: { inspection: Inspection; onClick: () => void }) {
  const fails = inspection.responses.filter((r) => r.answer === 'fail').length
  const total = inspection.responses.length

  // Determine the time string: future = scheduled, past = relative time
  const scheduledDate = new Date(inspection.scheduledFor)
  const inFuture = scheduledDate.getTime() > Date.now()
  const dateLabel = isToday(inspection.scheduledFor)
    ? `Today ${formatClockTime(inspection.scheduledFor)}`
    : inFuture
      ? formatDate(inspection.scheduledFor)
      : formatRelativeTime(inspection.scheduledFor)

  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[100px_2fr_1fr_1fr_1.1fr_1fr] gap-4 items-center px-6 py-4 text-left hover:bg-accent-light transition group"
    >
      {/* Number */}
      <div className="font-mono text-[13px] text-text-secondary">{inspection.number}</div>

      {/* Template + area */}
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
          {inspection.templateName}
        </div>
        <div className="text-[12px] text-text-secondary mt-0.5 truncate">
          {inspection.area ? `${inspection.area} · ` : ''}v{inspection.templateVersion}
          {total > 0 && (
            <>
              {' · '}
              <span className="font-mono">{total - fails}/{total} pass</span>
              {fails > 0 && (
                <>
                  {' · '}
                  <span className="font-mono text-status-fail font-semibold">{fails} fail</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Site */}
      <div className="text-[14px] font-semibold text-text-primary truncate">{inspection.siteName}</div>

      {/* Inspector */}
      <div className="flex items-center gap-2 min-w-0">
        {inspection.inspectorName ? (
          <>
            <Avatar name={inspection.inspectorName} size="w-6 h-6 text-[9px]" />
            <span className="text-[13px] text-text-secondary truncate">{inspection.inspectorName}</span>
          </>
        ) : (
          <span className="text-[13px] text-text-secondary italic">Unassigned</span>
        )}
      </div>

      {/* Scheduled */}
      <div className="text-[13px] font-mono text-text-secondary">{dateLabel}</div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-3">
        <StatusPill tone={STATUS_TONE[inspection.status]}>{STATUS_LABEL[inspection.status]}</StatusPill>
        <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light mb-4">
        <Icon name={hasFilters ? 'search' : 'check'} className="w-6 h-6 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary mb-1">
        {hasFilters ? 'No inspections match these filters' : 'No inspections yet'}
      </div>
      <div className="text-[13px] text-text-secondary max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different status tab.'
          : 'Schedule your first inspection to get started.'}
      </div>
    </div>
  )
}
