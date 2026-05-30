import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime, formatClockTime, isToday, formatDate, isTomorrow } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Inspection, InspectionStatus, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

type SortKey = 'number' | 'template' | 'scheduled' | 'status'
type SortDir = 'asc' | 'desc'
type StatusGroup = 'all' | 'todo' | 'submitted' | 'returned' | 'done'

const STATUS_GROUPS: { key: StatusGroup; label: string; matches: (s: InspectionStatus) => boolean }[] = [
  { key: 'all',       label: 'All',       matches: () => true },
  { key: 'todo',      label: 'To do',     matches: (s) => s === 'scheduled' || s === 'in_progress' },
  { key: 'submitted', label: 'Submitted', matches: (s) => s === 'submitted' || s === 'under_review' },
  { key: 'returned',  label: 'Returned',  matches: (s) => s === 'rejected' },
  { key: 'done',      label: 'Closed',    matches: (s) => s === 'approved' || s === 'issues_open' || s === 'issues_closed' || s === 'published' },
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
    <div className="space-y-6">
      {/* Header */}
      <PageBanner
        title={`My inspections`}
        subline={`${groupCounts.all} total · ${groupCounts.todo} to do · ${groupCounts.returned} returned to you.`}
      />

      {/* Filter bar */}
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
              placeholder="Search inspections..."
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

          <FilterSelect value={templateFilter} onChange={setTemplateFilter} options={[{ value: 'all', label: 'All templates' }, ...templates.map((s) => ({ value: s.id, label: s.name }))]} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[100px_2.5fr_1fr_1.2fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
          <SortHeader label="Number"    sortKey="number"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Template"  sortKey="template"  active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Scheduled" sortKey="scheduled" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Status"    sortKey="status"    active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasFilters={!!query || statusGroup !== 'all' || templateFilter !== 'all'} />
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
              Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {myInspections.length}
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
      className="w-full grid grid-cols-[100px_2.5fr_1fr_1.2fr] gap-4 items-center px-6 py-4 text-left hover:bg-accent-light transition group"
    >
      <div className="font-mono text-[13px] text-text-secondary">{inspection.number}</div>

      <div className="min-w-0 pr-4">
        <div className="text-[14px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
          {inspection.templateName}
        </div>
        <div className="text-[12px] text-text-secondary mt-0.5 truncate">
          {inspection.area ? `${inspection.area} · ` : ''}{inspection.siteName}
        </div>
      </div>

      <div className="text-[13px] font-mono text-text-secondary">
        {dateLabel}
      </div>

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
          : 'When inspections are assigned to you, they will appear here.'}
      </div>
    </div>
  )
}
