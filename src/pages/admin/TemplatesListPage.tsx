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
import { PageBanner } from '../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <PageBanner
        title={`Checklist templates`}
        subline={`${counts.all} total · ${counts.published} published · ${counts.draft} drafts`}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => nav.push('/admin/templates/new')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              + New template
            </button>
          </>
        }
      />

      {/* ============ Filter bar ============ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition ${ statusTab === tab.key ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
            >
              {tab.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ statusTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-accent-light text-text-secondary' }`}>
                {counts[tab.key]}
              </span>
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
              placeholder="Search templates..."
              className="w-full bg-white border border-text-secondary/15 rounded-lg pl-10 pr-8 py-2 text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Clear search">
                <Icon name="close" className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | InspectionTypeKey)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All types</option>
              {Object.values(INSPECTION_TYPES).map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[2.4fr_1fr_0.7fr_0.7fr_0.9fr_0.8fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
          <SortHeader label="Template"   sortKey="name"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Type"       sortKey="type"    active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Items"      sortKey="items"   active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Version"    sortKey="version" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Updated"    sortKey="updated" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary text-right pr-2">Status</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState query={query} statusTab={statusTab} typeFilter={typeFilter} />
        ) : (
          <div className="divide-y divide-text-secondary/15">
            {filtered.map((t) => (
              <TemplateRow key={t.id} template={t} onClick={() => nav.push(`/admin/templates/${t.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-text-secondary/15 flex items-center justify-between text-[12px] text-text-secondary bg-accent-light/50">
            <span>
              Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {templates.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}/* ============================================================
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
      className={`text-left text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${ isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary' }`}
    >
      {label}
      {isActive && <Icon name="chevron_down" className={`w-3.5 h-3.5 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />}
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
      className="w-full grid grid-cols-[2.4fr_1fr_0.7fr_0.7fr_0.9fr_0.8fr] gap-4 items-center px-6 py-4 text-left hover:bg-accent-light transition group"
    >
      {/* Name + summary */}
      <div className="min-w-0 pr-4">
        <div className="text-[14px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{template.name}</div>
        <div className="text-[12px] text-text-secondary mt-0.5 truncate">{template.summary}</div>
        {template.tags.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-text-secondary px-2 py-0.5 rounded bg-accent-light font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-[10px] font-mono text-text-secondary font-bold">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Type */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full ${type.accent} shrink-0`} />
        <span className="text-[13px] text-text-secondary truncate font-semibold">{type.label}</span>
      </div>

      {/* Items */}
      <div className="font-mono text-[13px] text-text-secondary">{template.itemCount}</div>

      {/* Version */}
      <div className="font-mono text-[13px] text-text-secondary">v{template.version}</div>

      {/* Updated */}
      <div className="text-[13px] font-mono text-text-secondary">
        {formatRelativeTime(template.updatedAt)}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2 pr-2">
        <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
        <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ query, statusTab, typeFilter }: { query: string; statusTab: string; typeFilter: string }) {
  const hasFilters = query || statusTab !== 'all' || typeFilter !== 'all'
  return (
    <div className="px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light mb-4">
        <Icon name={hasFilters ? 'search' : 'file'} className="w-6 h-6 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary mb-1">
        {hasFilters ? 'No templates match these filters' : 'No templates yet'}
      </div>
      <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different status tab.'
          : 'Build your first checklist template to standardize inspections across your sites.'}
      </p>
    </div>
  )
}
