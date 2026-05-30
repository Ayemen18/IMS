import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useSites } from '../../../lib/sites'
import { useInspections } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Site, SiteStatus } from '../../../types/site'
import { CreateSiteModal } from '../../../components/admin/CreateSiteModal'
import { PageBanner } from '../../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <PageBanner
        title={`Sites & departments`}
        subline={`${counts.all} sites · ${counts.departments} departments · ${counts.active} active`}
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
          >
            + New site
          </button>
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
              placeholder="Search sites..."
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
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as any)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">Domain: All</option>
              <option value="quality">Domain: Quality</option>
              <option value="safety">Domain: Safety</option>
              <option value="both">Domain: Both</option>
            </select>
            <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr_1.5fr_0.8fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
          <SortHeader label="Site" sortKey="name" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Location" sortKey="location" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Departments" sortKey="departments" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortHeader label="Recent activity" sortKey="activity" active={sortKey} dir={sortDir} onClick={toggleSort} />
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Certifications</div>
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
          <div className="divide-y divide-text-secondary/15">
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
          <div className="px-6 py-4 border-t border-text-secondary/15 flex items-center justify-between text-[12px] text-text-secondary bg-accent-light/50">
            <span>
              Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {sites.length}
            </span>
          </div>
        )}
      </div>

      <CreateSiteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(site) => nav.push(`/admin/organization/${site.id}`)}
      />
    </div>
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
      className={`text-left text-[11px] font-bold uppercase tracking-[0.12em] inline-flex items-center gap-1 transition-colors ${ isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary' } ${className}`}
    >
      {label}
      {isActive && (
        <Icon name="chevron_down" className={`w-3.5 h-3.5 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />
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
      className="grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr_1.5fr_0.8fr] gap-4 items-center px-6 py-4 hover:bg-accent-light transition group cursor-pointer"
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
          <div className="text-[11px] font-mono text-text-secondary truncate font-bold">{site.code}</div>
          <div className="text-[14px] font-semibold text-text-primary truncate">{site.name}</div>
        </div>
      </div>

      {/* Location */}
      <div className="min-w-0 text-[13px] text-text-secondary truncate font-semibold">
        {site.city}, {site.country}
      </div>

      {/* Departments */}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="font-mono text-[13px] text-text-primary font-bold">{departmentsCount}</span>
        <span className="text-[11px] text-text-secondary">depts</span>
      </div>

      {/* Recent activity */}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="font-mono text-[13px] text-text-primary font-bold">{recentActivity}</span>
        <span className="text-[11px] text-text-secondary">insp / 30d</span>
      </div>

      {/* Certifications */}
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        {site.certifications.slice(0, 3).map((cert, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-accent-light text-[11px] font-mono text-text-primary font-bold uppercase tracking-wider">
            {cert}
          </span>
        ))}
        {site.certifications.length > 3 && (
          <span className="text-[11px] text-text-secondary font-bold">+{site.certifications.length - 3} more</span>
        )}
        {site.certifications.length === 0 && (
          <span className="text-[11px] text-text-secondary font-semibold">—</span>
        )}
      </div>

      {/* Status + chevron */}
      <div className="flex items-center justify-end gap-2 pr-2">
        <div className="capitalize">
          <StatusPill tone={statusTone}>{site.status}</StatusPill>
        </div>
        <Icon
          name="chevron_right"
          className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all"
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
    <div className="px-6 py-20 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light mb-4">
        <Icon name={hasFilters ? 'search' : 'home'} className="w-6 h-6 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary mb-1">
        {hasFilters ? 'No sites match these filters' : 'No sites yet'}
      </div>
      <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto mb-6">
        {hasFilters
          ? 'Try clearing the search or switching to a different status or domain.'
          : 'Create your first site to get started.'}
      </p>
      {!hasFilters && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary text-white text-[13px] font-bold transition shadow-sm"
        >
          <Icon name="plus" className="w-4 h-4" />
          Create a site
        </button>
      )}
    </div>
  )
}
