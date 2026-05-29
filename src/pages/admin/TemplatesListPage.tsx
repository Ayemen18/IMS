import { useMemo, useState } from 'react'
import { useNav } from '../../lib/router'
import {
  useTemplates,
  INSPECTION_TYPES,
  formatRelativeTime,
} from '../../lib/templates'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'
import { statusToneFor, statusLabelFor } from '../../lib/templates'
import type { Template, InspectionTypeKey } from '../../types/template'

type SortKey = 'name' | 'type' | 'version' | 'updated' | 'items'
type SortDir = 'asc' | 'desc'

type ListTab = 'all' | 'published' | 'draft' | 'archived'

const STATUS_TABS: { key: ListTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Drafts' },
  { key: 'archived',  label: 'Archived' },
]

export function TemplatesListPage() {
  const nav = useNav()
  const { templates } = useTemplates()

  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState<ListTab>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | InspectionTypeKey>('all')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const counts = useMemo(() => ({
    all:       templates.filter((t) => t.status !== 'superseded').length,
    published: templates.filter((t) => t.status === 'published').length,
    draft:     templates.filter((t) => t.status === 'draft').length,
    archived:  templates.filter((t) => t.status === 'archived').length,
  }), [templates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (t: Template) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      t.ownerName.toLowerCase().includes(q)
    const matchesStatus = (t: Template) => {
      if (statusTab === 'all') return t.status !== 'superseded'
      return t.status === statusTab
    }
    const matchesType = (t: Template) => typeFilter === 'all' || t.inspectionType === typeFilter

    const result = templates.filter((t) => matchesQuery(t) && matchesStatus(t) && matchesType(t))
    const dir = sortDir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'name':    return a.name.localeCompare(b.name)
          case 'type':    return a.inspectionType.localeCompare(b.inspectionType)
          case 'version': return a.version.localeCompare(b.version, undefined, { numeric: true })
          case 'items':   return a.itemCount - b.itemCount
          case 'updated': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        }
      })()
      return cmp * dir
    })
    return result
  }, [templates, query, statusTab, typeFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'type' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="stagger">
      {/* ============ Header ============ */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>System Admin</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Templates</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            Checklist <span className="italic text-ink-500 dark:text-ink-400">templates</span>.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            {counts.all} total · {counts.published} published · {counts.draft} drafts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            <Icon name="download" className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => nav.push('/admin/templates/new')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            New template
          </button>
        </div>
      </div>

      {/* ============ Filter bar ============ */}
      <div className="mt-8 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-md border hairline bg-white dark:bg-ink-900">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-2 ${
                statusTab === tab.key
                  ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              {tab.label}
              <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] max-w-[360px] flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 focus-within:border-accent-500">
          <Icon name="search" className="w-3.5 h-3.5 text-ink-400 dark:text-ink-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, tag, owner…"
            className="flex-1 bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors" aria-label="Clear search">
              <Icon name="close" className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | InspectionTypeKey)}
            className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
          >
            <option value="all">All types</option>
            {Object.values(INSPECTION_TYPES).map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <Icon name="chevron_down" className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.4fr_1fr_0.7fr_0.7fr_0.9fr_0.8fr] gap-4 px-5 py-2.5 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
          <SortHeader label="Template"   sortKey="name"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Type"       sortKey="type"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Items"      sortKey="items"   active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Version"    sortKey="version" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Updated"    sortKey="updated" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 text-right">Status</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState query={query} statusTab={statusTab} typeFilter={typeFilter} />
        ) : (
          <div className="divide-y hairline">
            {filtered.map((t) => (
              <TemplateRow key={t.id} template={t} onClick={() => nav.push(`/admin/templates/${t.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t hairline flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400">
            <span>
              Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {templates.length}
            </span>
            <button className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors">View change history</button>
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
  label, sortKey, active, dir, onClick,
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
}) {
  const isActive = active === sortKey
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`text-left text-[10px] font-medium uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${
        isActive ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
      }`}
    >
      {label}
      {isActive && <Icon name="chevron_down" className={`w-3 h-3 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />}
    </button>
  )
}

function TemplateRow({ template, onClick }: { template: Template; onClick: () => void }) {
  const type = INSPECTION_TYPES[template.inspectionType]
  const statusTone = statusToneFor(template.status)
  const statusLabel = statusLabelFor(template.status)

  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[2.4fr_1fr_0.7fr_0.7fr_0.9fr_0.8fr] gap-4 items-center px-5 py-3.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      {/* Name + summary */}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{template.name}</div>
        <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">{template.summary}</div>
        {template.tags.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-ink-500 dark:text-ink-400 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Type */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-sm ${type.accent} shrink-0`} />
        <span className="text-[13px] text-ink-700 dark:text-ink-200 truncate">{type.label}</span>
      </div>

      {/* Items */}
      <div className="font-mono text-[12px] text-ink-700 dark:text-ink-200">{template.itemCount}</div>

      {/* Version */}
      <div className="font-mono text-[12px] text-ink-700 dark:text-ink-200">v{template.version}</div>

      {/* Updated */}
      <div className="text-[12px] font-mono text-ink-600 dark:text-ink-300">
        {formatRelativeTime(template.updatedAt)}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2">
        <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
        <Icon name="chevron_right" className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ query, statusTab, typeFilter }: { query: string; statusTab: string; typeFilter: string }) {
  const hasFilters = query || statusTab !== 'all' || typeFilter !== 'all'
  return (
    <div className="px-5 py-16 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed">
        <Icon name={hasFilters ? 'search' : 'file'} className="w-5 h-5 text-ink-400 dark:text-ink-500" />
      </div>
      <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
        {hasFilters ? 'No templates match these filters' : 'No templates yet'}
      </div>
      <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different status tab.'
          : 'Build your first checklist template to standardize inspections across your sites.'}
      </p>
    </div>
  )
}
