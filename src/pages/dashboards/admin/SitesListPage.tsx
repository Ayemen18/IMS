import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useSites } from '../../../lib/sites'
import { useInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Site, SiteStatus } from '../../../types/site'
import { CreateSiteModal } from '../../../components/admin/CreateSiteModal'

type SortKey = 'name' | 'location' | 'departments' | 'activity' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_TABS: { key: 'all' | SiteStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'commissioning', label: 'Commissioning' },
  { key: 'archived', label: 'Archived' },
]

export function SitesListPage() {
  const nav = useNav()
  const { sites, departments } = useSites()
  const { inspections } = useInspections()

  const [query, setQuery] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | SiteStatus>('all')
  const [domainFilter, setDomainFilter] = useState<'all' | 'quality' | 'safety' | 'both'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [createOpen, setCreateOpen] = useState(false)

  const counts = useMemo(() => ({
    all: sites.length,
    active: sites.filter((s) => s.status === 'active').length,
    commissioning: sites.filter((s) => s.status === 'commissioning').length,
    archived: sites.filter((s) => s.status === 'archived').length,
    departments: departments.length,
  }), [sites, departments])

  const recentActivityMap = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const activity = new Map<string, number>()
    sites.forEach(s => activity.set(s.name, 0))
    
    inspections.forEach(ins => {
      const ts = ins.createdAt ? new Date(ins.createdAt).getTime() : 0
      if (ts >= thirtyDaysAgo && activity.has(ins.siteName)) {
        activity.set(ins.siteName, (activity.get(ins.siteName) || 0) + 1)
      }
    })
    return activity
  }, [inspections, sites])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = (s: Site) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    const matchesStatus = (s: Site) => statusTab === 'all' || s.status === statusTab
    const matchesDomain = (s: Site) => domainFilter === 'all' || s.primaryDomain === domainFilter || s.primaryDomain === 'both'

    const result = sites.filter((s) => matchesQuery(s) && matchesStatus(s) && matchesDomain(s))
    const dir = sortDir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'name': return a.name.localeCompare(b.name)
          case 'location': return a.city.localeCompare(b.city)
          case 'departments': {
            const aDepts = departments.filter(d => d.siteId === a.id).length
            const bDepts = departments.filter(d => d.siteId === b.id).length
            return aDepts - bDepts
          }
          case 'activity': {
            const aAct = recentActivityMap.get(a.name) || 0
            const bAct = recentActivityMap.get(b.name) || 0
            return aAct - bAct
          }
          case 'status': return a.status.localeCompare(b.status)
        }
      })()
      return cmp * dir
    })
    return result
  }, [sites, query, statusTab, domainFilter, sortKey, sortDir, departments, recentActivityMap])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'location' || key === 'status' ? 'asc' : 'desc')
    }
  }

  return (
    <>
      <div className="stagger">
        {/* ============ Header ============ */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
              <span>System Admin</span>
              <Icon name="chevron_right" className="w-3 h-3" />
              <span className="text-ink-900 dark:text-ink-50">Sites &amp; departments</span>
            </div>
            <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
              Sites &amp; <span className="italic text-ink-500 dark:text-ink-400">departments</span>.
            </h1>
            <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
              {counts.all} sites · {counts.departments} departments · {counts.active} active.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              New site
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
                <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] max-w-[360px] flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 focus-within:border-accent-500">
            <Icon name="search" className="w-3.5 h-3.5 text-ink-400 dark:text-ink-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites by name, code, city..."
              className="flex-1 bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors" aria-label="Clear search">
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
            >
              <option value="all">Domain: All</option>
              <option value="quality">Domain: Quality</option>
              <option value="safety">Domain: Safety</option>
              <option value="both">Domain: Both</option>
            </select>
            <Icon name="chevron_down" className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
          </div>
        </div>

        {/* ============ Table ============ */}
        <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr_1.5fr_0.8fr] gap-4 px-5 py-2.5 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
            <SortHeader label="Site" sortKey="name" active={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortHeader label="Location" sortKey="location" active={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortHeader label="Departments" sortKey="departments" active={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortHeader label="Recent activity" sortKey="activity" active={sortKey} dir={sortDir} onClick={toggleSort} />
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Certifications</div>
            <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onClick={toggleSort} className="justify-end" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              query={query}
              statusTab={statusTab}
              domainFilter={domainFilter}
              onCreate={() => setCreateOpen(true)}
            />
          ) : (
            <div className="divide-y hairline">
              {filtered.map((s) => (
                <SiteRow
                  key={s.id}
                  site={s}
                  departmentsCount={departments.filter(d => d.siteId === s.id).length}
                  recentActivity={recentActivityMap.get(s.name) || 0}
                  onClick={() => nav.push(`/admin/organization/${s.id}`)}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t hairline flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400">
              <span>
                Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {sites.length}
              </span>
              <button className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
                View audit log
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateSiteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(site) => nav.push(`/admin/organization/${site.id}`)}
      />
    </>
  )
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onClick,
  className = ''
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
  className?: string
}) {
  const isActive = active === sortKey
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`text-left text-[10px] font-medium uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${
        isActive ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
      } ${className}`}
    >
      {label}
      {isActive && (
        <Icon name="chevron_down" className={`w-3 h-3 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  )
}

function SiteRow({
  site,
  departmentsCount,
  recentActivity,
  onClick,
}: {
  site: Site
  departmentsCount: number
  recentActivity: number
  onClick: () => void
}) {
  const statusTone =
    site.status === 'active' ? 'green'
    : site.status === 'commissioning' ? 'amber'
    : 'neutral'

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr_1.5fr_0.8fr] gap-4 items-center px-5 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Site */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 truncate">{site.code}</div>
          <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{site.name}</div>
        </div>
      </div>

      {/* Location */}
      <div className="min-w-0 text-[13px] text-ink-700 dark:text-ink-200 truncate">
        {site.city}, {site.country}
      </div>

      {/* Departments */}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{departmentsCount}</span>
        <span className="text-[11px] text-ink-500 dark:text-ink-400">departments</span>
      </div>

      {/* Recent activity */}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="font-mono text-[13px] text-ink-900 dark:text-ink-50">{recentActivity}</span>
        <span className="text-[11px] text-ink-500 dark:text-ink-400">inspections / 30d</span>
      </div>

      {/* Certifications */}
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        {site.certifications.slice(0, 3).map((cert, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-[11px] font-medium text-ink-700 dark:text-ink-200">
            {cert}
          </span>
        ))}
        {site.certifications.length > 3 && (
          <span className="text-[11px] text-ink-500 dark:text-ink-400">+{site.certifications.length - 3} more</span>
        )}
        {site.certifications.length === 0 && (
          <span className="text-[11px] text-ink-400 dark:text-ink-600">—</span>
        )}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2">
        <div className="capitalize">
          <StatusPill tone={statusTone}>{site.status}</StatusPill>
        </div>
        <Icon
          name="chevron_right"
          className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </div>
  )
}

function EmptyState({
  query,
  statusTab,
  domainFilter,
  onCreate,
}: {
  query: string
  statusTab: string
  domainFilter: string
  onCreate: () => void
}) {
  const hasFilters = query || statusTab !== 'all' || domainFilter !== 'all'
  return (
    <div className="px-5 py-16 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed">
        <Icon name={hasFilters ? 'search' : 'home'} className="w-5 h-5 text-ink-400 dark:text-ink-500" />
      </div>
      <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
        {hasFilters ? 'No sites match these filters' : 'No sites yet'}
      </div>
      <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[360px] mx-auto">
        {hasFilters
          ? 'Try clearing the search or switching to a different status or domain.'
          : 'Create your first site to get started.'}
      </p>
      {!hasFilters && (
        <button
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Create a site
        </button>
      )}
    </div>
  )
}
