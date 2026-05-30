import { useMemo, useState } from 'react'
import { useNav } from '../../lib/router'
import { useParameters, PARAMETER_CATEGORIES } from '../../lib/parameters'
import { formatRelativeTime } from '../../lib/templates'
import { Icon } from '../../components/primitives/Icon'
import type { Parameter, ParameterType } from '../../types/parameter'
import { PageBanner } from '../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <PageBanner
        title={`Parameter library`}
        subline={`${counts.all} total parameters across ${PARAMETER_CATEGORIES.length} categories`}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => nav.push('/admin/parameters/new')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              + New parameter
            </button>
          </>
        }
      />

      {/* ============ Filter bar ============ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl max-w-full overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setCategoryTab('all')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition shrink-0 ${ categoryTab === 'all' ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
          >
            All
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ categoryTab === 'all' ? 'bg-primary/10 text-primary' : 'bg-accent-light text-text-secondary' }`}>
              {counts.all}
            </span>
          </button>
          {PARAMETER_CATEGORIES.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition shrink-0 ${ categoryTab === tab.key ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${tab.accent}`} />
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ categoryTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-accent-light text-text-secondary' }`}>
                  {counts[tab.key]}
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
              placeholder="Search parameters..."
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
              onChange={(e) => setTypeFilter(e.target.value as 'all' | ParameterType)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">All types</option>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[2.5fr_1fr_1fr_0.8fr_0.6fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
          <SortHeader label="Parameter"  sortKey="name"     active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Category"   sortKey="category" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Type"       sortKey="type"     active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Updated"    sortKey="updated"  active={sortKey} dir={sortDir} onClick={toggleSort} />
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary text-right pr-2">Status</div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState query={query} categoryTab={categoryTab} typeFilter={typeFilter} />
        ) : (
          <div className="divide-y divide-text-secondary/15">
            {filtered.map((p) => (
              <ParameterRow key={p.id} parameter={p} onClick={() => nav.push(`/admin/parameters/${p.id}`)} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-text-secondary/15 flex items-center justify-between text-[12px] text-text-secondary bg-accent-light/50">
            <span>
              Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {parameters.length}
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
      className={`text-left text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${ isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary' }`}
    >
      {label}
      {isActive && <Icon name="chevron_down" className={`w-3.5 h-3.5 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />}
    </button>
  )
}

function ParameterRow({ parameter, onClick }: { parameter: Parameter; onClick: () => void }) {
  const categoryMeta = PARAMETER_CATEGORIES.find(c => c.key === parameter.category)
  
  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[2.5fr_1fr_1fr_0.8fr_0.6fr] gap-4 items-start px-6 py-4 text-left hover:bg-accent-light transition group"
    >
      {/* Name + code + description */}
      <div className="min-w-0 pr-4">
        <div className="flex items-baseline gap-2">
          <div className="text-[14px] font-semibold text-text-primary truncate">{parameter.name}</div>
          <div className="text-[11px] font-mono text-text-secondary shrink-0 font-bold">{parameter.code}</div>
        </div>
        <div className="text-[12px] text-text-secondary mt-1 line-clamp-2 leading-relaxed font-medium">
          {parameter.description}
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 min-w-0 pt-0.5">
        <span className={`w-2 h-2 rounded-full ${categoryMeta?.accent || 'bg-accent-light'} shrink-0`} />
        <span className="text-[13px] text-text-secondary truncate font-semibold">{categoryMeta?.label || parameter.category}</span>
      </div>

      {/* Type */}
      <div className="min-w-0 pt-0.5">
        <span className="text-[10px] font-mono text-text-primary font-bold px-2 py-0.5 rounded bg-accent-light uppercase tracking-wider block w-max max-w-full">
          {TYPE_LABELS[parameter.type]}
        </span>
      </div>

      {/* Updated */}
      <div className="text-[13px] font-mono text-text-secondary pt-0.5">
        {formatRelativeTime(parameter.updatedAt)}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2 pt-0.5 pr-2">
        <span className="text-[11px] font-bold text-status-pass">Active</span>
        <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmptyState({ query, categoryTab, typeFilter }: { query: string; categoryTab: string; typeFilter: string }) {
  const hasFilters = query || categoryTab !== 'all' || typeFilter !== 'all'
  return (
    <div className="px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light mb-4">
        <Icon name={hasFilters ? 'search' : 'cube_3d'} className="w-6 h-6 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary mb-1">
        {hasFilters ? 'No parameters match these filters' : 'Library is empty'}
      </div>
      <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different category.'
          : 'Build reusable inspection parameters to ensure standardization across templates.'}
      </p>
    </div>
  )
}
