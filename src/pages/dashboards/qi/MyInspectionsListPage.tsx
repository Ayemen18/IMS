import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, formatClockTime, isToday, formatDate, isTomorrow } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Inspection, InspectionStatus, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'

type SortKey = 'number' | 'template' | 'scheduled' | 'status'
type SortDir = 'asc' | 'desc'
type StatusGroup = 'all' | 'todo' | 'submitted' | 'returned' | 'done'

const STATUS_GROUPS: { key: StatusGroup; label: string; matches: (s: InspectionStatus) => boolean }[] = [
  { key: 'all',       label: 'All',       matches: () => true },
  { key: 'todo',      label: 'To do',     matches: (s) => s === 'scheduled' || s === 'in_progress' },
  { key: 'submitted', label: 'Submitted', matches: (s) => s === 'submitted' || s === 'under_review' },
  { key: 'returned',  label: 'Returned',  matches: (s) => s === 'rejected' },
  { key: 'done',      label: 'Done',      matches: (s) => s === 'approved' || s === 'issues_open' || s === 'issues_closed' || s === 'published' },
]

function filterToMyInspections(
  inspections: Inspection[],
  user: { name: string; email: string } | null
): Inspection[] {
  if (!user) return []
  return inspections.filter(
    (i) => i.inspectorName === user.name || i.inspectorId === user.email
  )
}

export function MyInspectionsListPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { user } = useSession()
  const { inspections } = useInspections()

  const myInspections = useMemo(() => filterToMyInspections(inspections.filter(i => i.domain === domain), user), [inspections, user, domain])

  const [query, setQuery] = useState('')
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('todo')
  const [templateFilter, setTemplateFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('scheduled')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const templates = useMemo(() => {
    const m = new Map<string, string>()
    myInspections.forEach((i) => m.set(i.templateId, i.templateName))
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }))
  }, [myInspections])

  const groupCounts = useMemo(() => {
    const obj: Record<StatusGroup, number> = { all: 0, todo: 0, submitted: 0, returned: 0, done: 0 }
    myInspections.forEach((i) => {
      STATUS_GROUPS.forEach((g) => {
        if (g.matches(i.status)) obj[g.key] += 1
      })
    })
    return obj
  }, [myInspections])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (i: Inspection) =>
      !q ||
      i.number.toLowerCase().includes(q) ||
      i.templateName.toLowerCase().includes(q) ||
      (i.area ?? '').toLowerCase().includes(q)
      
    const matchesStatus = (i: Inspection) =>
      STATUS_GROUPS.find((g) => g.key === statusGroup)!.matches(i.status)
      
    const matchesTemplate = (i: Inspection) => templateFilter === 'all' || i.templateId === templateFilter

    const result = myInspections.filter(
      (i) => matchesQuery(i) && matchesStatus(i) && matchesTemplate(i)
    )
    
    const dir = sortDir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'number':    return a.number.localeCompare(b.number)
          case 'template':  return a.templateName.localeCompare(b.templateName)
          case 'scheduled': return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
          case 'status':    return a.status.localeCompare(b.status)
        }
      })()
      return cmp * dir
    })
    return result
  }, [myInspections, query, statusGroup, templateFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'scheduled' || key === 'number' || key === 'template' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="stagger">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>{domain === 'safety' ? 'Safety Inspector' : 'Quality Inspector'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Inspections</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            <span className="italic">My</span> inspections.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            {groupCounts.all} total · {groupCounts.todo} to do · {groupCounts.returned} returned to you.
          </p>
        </div>
      </div>

      {/* Filter bar */}
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
            placeholder="Search by number, template, area…"
            className="flex-1 bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors" aria-label="Clear search">
              <Icon name="close" className="w-3 h-3" />
            </button>
          )}
        </div>

        <FilterSelect value={templateFilter} onChange={setTemplateFilter} options={[{ value: 'all', label: 'All templates' }, ...templates.map((s) => ({ value: s.id, label: s.name }))]} />
      </div>

      {/* Table */}
      <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
        <div className="grid grid-cols-[100px_2.5fr_1fr_1.2fr] gap-4 px-6 py-3 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
          <SortHeader label="Number"    sortKey="number"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Template"  sortKey="template"  active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Scheduled" sortKey="scheduled" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Status"    sortKey="status"    active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasFilters={!!query || statusGroup !== 'all' || templateFilter !== 'all'} />
        ) : (
          <div className="divide-y hairline">
            {filtered.map((i) => (
              <InspectionRow key={i.id} inspection={i} onClick={() => nav.push(`${prefix}/inspections/${i.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t hairline flex items-center justify-between text-[13px] text-ink-500 dark:text-ink-400">
            <span>
              Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {myInspections.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

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
      className={`${align === 'right' ? 'text-right justify-end' : 'text-left'} text-[11px] font-medium uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${
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
        className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="chevron_down" className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
    </div>
  )
}

function InspectionRow({ inspection, onClick }: { inspection: Inspection; onClick: () => void }) {
  const scheduledDate = new Date(inspection.scheduledFor)
  const inFuture = scheduledDate.getTime() > Date.now()
  let dateLabel = ''
  if (isToday(inspection.scheduledFor)) {
    dateLabel = `Today ${formatClockTime(inspection.scheduledFor)}`
  } else if (isTomorrow(inspection.scheduledFor)) {
    dateLabel = `Tomorrow ${formatClockTime(inspection.scheduledFor)}`
  } else if (inFuture) {
    dateLabel = formatDate(inspection.scheduledFor)
  } else {
    dateLabel = formatRelativeTime(inspection.scheduledFor)
  }

  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[100px_2.5fr_1fr_1.2fr] gap-4 items-center px-6 py-5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      <div className="font-mono text-[13px] text-ink-600 dark:text-ink-300">{inspection.number}</div>

      <div className="min-w-0 pr-4">
        <div className="text-[15px] font-medium text-ink-900 dark:text-ink-50 truncate">
          {inspection.templateName}
        </div>
        <div className="text-[13px] text-ink-500 dark:text-ink-400 mt-1 truncate">
          {inspection.area ? `${inspection.area} · ` : ''}{inspection.siteName}
        </div>
        <div className="text-[12px] font-mono text-ink-400 dark:text-ink-500 mt-1">
          {dateLabel}
        </div>
      </div>

      <div className="text-[13px] font-mono text-ink-700 dark:text-ink-200">
        {dateLabel}
      </div>

      <div className="flex items-center justify-end gap-3">
        <StatusPill tone={STATUS_TONE[inspection.status]}>{STATUS_LABEL[inspection.status]}</StatusPill>
        <Icon name="chevron_right" className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border hairline border-dashed">
        <Icon name={hasFilters ? 'search' : 'check'} className="w-6 h-6 text-ink-400 dark:text-ink-500" />
      </div>
      <div className="mt-5 text-[16px] font-medium text-ink-900 dark:text-ink-50">
        {hasFilters ? 'No inspections match these filters' : 'No inspections yet'}
      </div>
      <p className="mt-1.5 text-[14px] text-ink-500 dark:text-ink-400 max-w-[400px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different tab.'
          : 'When inspections are assigned to you, they will appear here.'}
      </p>
    </div>
  )
}
