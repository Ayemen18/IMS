import { useMemo, useState } from 'react'
import { useNav } from '../../lib/router'
import { useParameters, PARAMETER_CATEGORIES } from '../../lib/parameters'
import { formatRelativeTime } from '../../lib/templates'
import { Icon } from '../../components/primitives/Icon'
import type { Parameter, ParameterType } from '../../types/parameter'

const TYPE_LABELS: Record<ParameterType, string> = {
  pass_fail_na: 'Pass / Fail / N/A',
  numeric: 'Numeric',
  text: 'Free text',
  single_select: 'Single select',
}

type SortKey = 'name' | 'type' | 'category' | 'updated'
type SortDir = 'asc' | 'desc'

export function ParametersListPage() {
  const nav = useNav()
  const { parameters } = useParameters()

  const [query, setQuery] = useState('')
  const [categoryTab, setCategoryTab] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ParameterType>('all')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: parameters.length }
    PARAMETER_CATEGORIES.forEach((c) => {
      map[c.key] = parameters.filter((p) => p.category === c.key).length
    })
    return map
  }, [parameters])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (p: Parameter) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((tag) => tag.toLowerCase().includes(q))
      
    const matchesCategory = (p: Parameter) => categoryTab === 'all' || p.category === categoryTab
    const matchesType = (p: Parameter) => typeFilter === 'all' || p.type === typeFilter

    const result = parameters.filter((p) => matchesQuery(p) && matchesCategory(p) && matchesType(p))
    const dir = sortDir === 'asc' ? 1 : -1
    
    result.sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'name':     return a.name.localeCompare(b.name)
          case 'category': return a.category.localeCompare(b.category)
          case 'type':     return a.type.localeCompare(b.type)
          case 'updated':  return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        }
      })()
      return cmp * dir
    })
    return result
  }, [parameters, query, categoryTab, typeFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'updated' ? 'desc' : 'asc')
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
            <span className="text-ink-900 dark:text-ink-50">Parameters</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            Parameter <span className="italic text-ink-500 dark:text-ink-400">library</span>.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            {counts.all} total parameters across {PARAMETER_CATEGORIES.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            <Icon name="download" className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => nav.push('/admin/parameters/new')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            New parameter
          </button>
        </div>
      </div>

      {/* ============ Filter bar ============ */}
      <div className="mt-8 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-md border hairline bg-white dark:bg-ink-900 max-w-full overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setCategoryTab('all')}
            className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-2 shrink-0 ${
              categoryTab === 'all'
                ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
            }`}
          >
            All
            <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">{counts.all}</span>
          </button>
          {PARAMETER_CATEGORIES.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryTab(tab.key)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-2 shrink-0 ${
                categoryTab === tab.key
                  ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${tab.accent}`} />
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
            placeholder="Search library…"
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
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ParameterType)}
            className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <Icon name="chevron_down" className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.5fr_1fr_1fr_0.8fr_0.6fr] gap-4 px-5 py-2.5 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
          <SortHeader label="Parameter"  sortKey="name"     active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Category"   sortKey="category" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Type"       sortKey="type"     active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Updated"    sortKey="updated"  active={sortKey} dir={sortDir} onClick={toggleSort} />
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 text-right">Status</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState query={query} categoryTab={categoryTab} typeFilter={typeFilter} />
        ) : (
          <div className="divide-y hairline">
            {filtered.map((p) => (
              <ParameterRow key={p.id} parameter={p} onClick={() => nav.push(`/admin/parameters/${p.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t hairline flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400">
            <span>
              Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {parameters.length}
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

function ParameterRow({ parameter, onClick }: { parameter: Parameter; onClick: () => void }) {
  const categoryMeta = PARAMETER_CATEGORIES.find(c => c.key === parameter.category)
  
  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[2.5fr_1fr_1fr_0.8fr_0.6fr] gap-4 items-start px-5 py-3.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      {/* Name + code + description */}
      <div className="min-w-0 pr-4">
        <div className="flex items-baseline gap-2">
          <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{parameter.name}</div>
          <div className="text-[10px] font-mono text-ink-500 dark:text-ink-400 shrink-0">{parameter.code}</div>
        </div>
        <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-1 line-clamp-2 leading-relaxed">
          {parameter.description}
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 min-w-0 pt-0.5">
        <span className={`w-2 h-2 rounded-full ${categoryMeta?.accent || 'bg-ink-400'} shrink-0`} />
        <span className="text-[13px] text-ink-700 dark:text-ink-200 truncate">{categoryMeta?.label || parameter.category}</span>
      </div>

      {/* Type */}
      <div className="min-w-0 pt-0.5">
        <span className="text-[10px] font-mono text-ink-600 dark:text-ink-300 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 truncate block w-max max-w-full">
          {TYPE_LABELS[parameter.type]}
        </span>
      </div>

      {/* Updated */}
      <div className="text-[12px] font-mono text-ink-600 dark:text-ink-300 pt-0.5">
        {formatRelativeTime(parameter.updatedAt)}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2 pt-0.5">
        <span className="text-[11px] font-medium text-signal-green">Active</span>
        <Icon name="chevron_right" className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ query, categoryTab, typeFilter }: { query: string; categoryTab: string; typeFilter: string }) {
  const hasFilters = query || categoryTab !== 'all' || typeFilter !== 'all'
  return (
    <div className="px-5 py-16 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed">
        <Icon name={hasFilters ? 'search' : 'cube_3d'} className="w-5 h-5 text-ink-400 dark:text-ink-500" />
      </div>
      <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
        {hasFilters ? 'No parameters match these filters' : 'Library is empty'}
      </div>
      <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different category.'
          : 'Build reusable inspection parameters to ensure standardization across templates.'}
      </p>
    </div>
  )
}
