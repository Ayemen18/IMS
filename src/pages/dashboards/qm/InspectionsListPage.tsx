import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, formatClockTime, isToday, formatDate } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import { Avatar } from '../../../components/primitives/Avatar'
import type { Inspection, InspectionStatus, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'

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
    <div className="stagger">
      {/* ============ Header ============ */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>{domain === 'safety' ? 'Safety Manager' : 'Quality Manager'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Inspections</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            All <span className="italic text-ink-500 dark:text-ink-400">inspections</span>.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            {groupCounts.all} total · {groupCounts.review} need review · {groupCounts.open} with open issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            <Icon name="download" className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => nav.push(`${prefix}/schedule`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            New inspection
          </button>
        </div>
      </div>

      {/* ============ Filter bar ============ */}
      <div className="mt-8 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-md border hairline bg-white dark:bg-ink-900">
          {STATUS_GROUPS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusGroup(tab.key)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-2 ${
                statusGroup === tab.key
                  ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              {tab.label}
              <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">{groupCounts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] max-w-[360px] flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 focus-within:border-accent-500">
          <Icon name="search" className="w-3.5 h-3.5 text-ink-400 dark:text-ink-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by number, template, site, inspector…"
            className="flex-1 bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors" aria-label="Clear search">
              <Icon name="close" className="w-3 h-3" />
            </button>
          )}
        </div>

        <FilterSelect value={siteFilter} onChange={setSiteFilter} options={[{ value: 'all', label: 'All sites' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]} />
        <FilterSelect value={inspectorFilter} onChange={setInspectorFilter} options={[{ value: 'all', label: 'All inspectors' }, ...inspectors.map((i) => ({ value: i.id, label: i.name }))]} />
      </div>

      {/* ============ Table ============ */}
      <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
        <div className="grid grid-cols-[100px_2fr_1fr_1fr_1.1fr_1fr] gap-4 px-5 py-2.5 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
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
          <div className="divide-y hairline">
            {filtered.map((i) => (
              <InspectionRow key={i.id} inspection={i} onClick={() => nav.push(`${prefix}/inspections/${i.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t hairline flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400">
            <span>
              Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {inspections.length}
            </span>
            <button className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors">View audit log</button>
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
      className={`${align === 'right' ? 'text-right justify-end' : 'text-left'} text-[10px] font-medium uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${
        isActive ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
      }`}
    >
      {label}
      {isActive && <Icon name="chevron_down" className={`w-3 h-3 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />}
    </button>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="chevron_down" className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
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
      className="w-full grid grid-cols-[100px_2fr_1fr_1fr_1.1fr_1fr] gap-4 items-center px-5 py-3.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      {/* Number */}
      <div className="font-mono text-[11px] text-ink-600 dark:text-ink-300">{inspection.number}</div>

      {/* Template + area */}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">
          {inspection.templateName}
        </div>
        <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">
          {inspection.area ? `${inspection.area} · ` : ''}v{inspection.templateVersion}
          {total > 0 && (
            <>
              {' · '}
              <span className="font-mono">{total - fails}/{total} pass</span>
              {fails > 0 && (
                <>
                  {' · '}
                  <span className="font-mono text-signal-red">{fails} fail</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Site */}
      <div className="text-[13px] text-ink-700 dark:text-ink-200 truncate">{inspection.siteName}</div>

      {/* Inspector */}
      <div className="flex items-center gap-2 min-w-0">
        {inspection.inspectorName ? (
          <>
            <Avatar name={inspection.inspectorName} size="w-6 h-6 text-[9px]" />
            <span className="text-[12px] text-ink-700 dark:text-ink-200 truncate">{inspection.inspectorName}</span>
          </>
        ) : (
          <span className="text-[12px] text-ink-500 dark:text-ink-400 italic">Unassigned</span>
        )}
      </div>

      {/* Scheduled */}
      <div className="text-[12px] font-mono text-ink-600 dark:text-ink-300">{dateLabel}</div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2">
        <StatusPill tone={STATUS_TONE[inspection.status]}>{STATUS_LABEL[inspection.status]}</StatusPill>
        <Icon name="chevron_right" className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="px-5 py-16 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed">
        <Icon name={hasFilters ? 'search' : 'check'} className="w-5 h-5 text-ink-400 dark:text-ink-500" />
      </div>
      <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
        {hasFilters ? 'No inspections match these filters' : 'No inspections yet'}
      </div>
      <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different status tab.'
          : 'Schedule your first inspection to get started.'}
      </p>
    </div>
  )
}
