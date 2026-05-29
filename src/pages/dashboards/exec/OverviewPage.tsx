import { useState } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import {
  useInspections,
  flattenIssues,
  computeComplianceRate,
  computeSitesAtRisk,
  computeAgingIssues,
  computeThroughput,
  filterInspections
} from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'

type DomainFilter = 'all' | 'quality' | 'safety'

export function OverviewPage() {
  const { user } = useSession()
  const { inspections } = useInspections()
  const nav = useNav()
  const [domain, setDomain] = useState<DomainFilter>('all')

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Executive'
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'

  // ==========================================================
  // KPIs
  // ==========================================================
  const windowDays = 7
  
  // 1. Inspections this week
  const inspsThisWeek = filterInspections(inspections, windowDays, domain).length
  const inspsLastWeek = filterInspections(inspections, windowDays * 2, domain).length - inspsThisWeek
  const inspDelta = inspsLastWeek > 0 ? Math.round(((inspsThisWeek - inspsLastWeek) / inspsLastWeek) * 100) : 0
  const throughputDown = inspDelta < -10

  // 2. Compliance rate (30 days)
  const comp30d = computeComplianceRate(inspections, 30, domain)
  const prevComp = computeComplianceRate(inspections, 60, domain)
  const compDelta = comp30d - prevComp // percentage points

  // 3. Open issues
  const allIssues = flattenIssues(inspections)
  const openIssues = allIssues.filter((f: any) => 
    (domain === 'all' || f.inspection.domain === domain) && 
    ['open', 'in_progress', 'reopened'].includes(f.issue.state)
  )
  const totalOpen = openIssues.length
  const agedIssues = computeAgingIssues(inspections, 7, domain)
  const agedIssuesDelta = agedIssues - computeAgingIssues(inspections, 14, domain) // very rough delta

  // 4. Sites at risk
  const sitesAtRisk = computeSitesAtRisk(inspections, 30, domain)

  // Subheading logic
  let subheading = `All tracking on schedule · ${inspsThisWeek} inspections completed this week.`
  if (sitesAtRisk.length > 0) {
    subheading = `${sitesAtRisk.length} site${sitesAtRisk.length === 1 ? '' : 's'} at risk across the operation.`
  } else if (agedIssues > 0) {
    subheading = `${inspsThisWeek} inspections published this week · ${agedIssues} issues aging beyond 7 days.`
  } else if (throughputDown) {
    subheading = `Throughput down ${Math.abs(inspDelta)}% week-over-week — see Trends.`
  }

  // ==========================================================
  // Left Column: This Week (Throughput)
  // ==========================================================
  const throughputData = computeThroughput(inspections, 7, domain)
  const maxThroughput = Math.max(1, ...throughputData.map((d: any) => d.count))
  const todayStr = new Date().toISOString().split('T')[0]

  const weeklyIssuesRaised = openIssues.filter((f: any) => {
    const ageDays = (Date.now() - new Date(f.issue.createdAt).getTime()) / 86400000
    return ageDays <= 7
  }).length

  const weeklyIssuesClosed = allIssues.filter((f: any) => 
    (domain === 'all' || f.inspection.domain === domain) && 
    f.issue.state === 'closed' && 
    f.issue.verifiedAt && 
    (Date.now() - new Date(f.issue.verifiedAt).getTime()) / 86400000 <= 7
  ).length

  // ==========================================================
  // Right Column: Needs Attention
  // ==========================================================
  // We'll generate a few synthetic attention items based on real data
  const attentionItems: { id: string, title: string, context: string, tone: 'red' | 'amber', to: string }[] = []

  // 1. Any sites at risk
  sitesAtRisk.slice(0, 2).forEach((siteId: any) => {
    const siteInsps = inspections.filter((i: any) => i.siteId === siteId && (domain === 'all' || i.domain === domain))
    const rate = computeComplianceRate(siteInsps, 30)
    attentionItems.push({
      id: `site-${siteId}`,
      title: `${siteInsps[0]?.siteName || siteId} compliance at ${rate}%`,
      context: `Falling below 90% threshold for the last 30 days.`,
      tone: 'red',
      to: '/exec/by_site'
    })
  })

  // 2. Oldest issue
  if (agedIssues > 0) {
    const sortedAged = openIssues.sort((a: any, b: any) => new Date(a.issue.createdAt).getTime() - new Date(b.issue.createdAt).getTime())
    const oldest = sortedAged[0]
    const ageDays = Math.floor((Date.now() - new Date(oldest.issue.createdAt).getTime()) / 86400000)
    attentionItems.push({
      id: `issue-${oldest.issue.id}`,
      title: `Issue ${oldest.issue.id} aged ${ageDays} days`,
      context: `Assigned to ${oldest.issue.assigneeName}. At ${oldest.inspection.siteName}.`,
      tone: 'amber',
      to: '/exec/issues'
    })
  }

  // 3. Overall throughput
  if (throughputDown) {
    attentionItems.push({
      id: 'throughput',
      title: `Throughput dropped ${Math.abs(inspDelta)}%`,
      context: `Only ${inspsThisWeek} inspections this week vs ${inspsLastWeek} last week.`,
      tone: 'amber',
      to: '/exec/trends'
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. Hero Section */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-10">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 uppercase tracking-widest">
              Top Management {'>'} Overview
            </div>
            <div>
              <h1 className="font-display text-[44px] leading-tight text-ink-900 dark:text-ink-50">
                {greeting}, <span className="italic">{firstName}</span>.
              </h1>
              <p className="text-[16px] text-ink-600 dark:text-ink-300 mt-2">
                {subheading}
              </p>
            </div>
          </div>

          <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-md">
            {(['all', 'quality', 'safety'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-4 py-1.5 text-[13px] font-medium rounded capitalize transition-colors ${
                  domain === d 
                    ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20' 
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Hero KPI Grid */}
        <div className="grid grid-cols-4 gap-8">
          {/* KPI 1 */}
          <div className="space-y-2">
            <div className="text-[12px] uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400 font-medium">Inspections this week</div>
            <div className="font-display text-[56px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
              {inspsThisWeek}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">vs {inspsLastWeek} last week</span>
              {inspDelta !== 0 && (
                <span className={`font-mono text-[11px] flex items-center gap-0.5 ${inspDelta > 0 ? 'text-signal-green' : 'text-signal-red'}`}>
                  {inspDelta > 0 ? '▲' : '▼'} {Math.abs(inspDelta)}%
                </span>
              )}
            </div>
          </div>

          {/* KPI 2 */}
          <div className="space-y-2">
            <div className="text-[12px] uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400 font-medium">Compliance rate</div>
            <div className="font-display text-[56px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
              {comp30d}<span className="text-[32px]">%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">last 30 days</span>
              {compDelta !== 0 && (
                <span className={`font-mono text-[11px] flex items-center gap-0.5 ${compDelta > 0 ? 'text-signal-green' : 'text-signal-red'}`}>
                  {compDelta > 0 ? '▲' : '▼'} {Math.abs(compDelta)}pt
                </span>
              )}
            </div>
          </div>

          {/* KPI 3 */}
          <div className="space-y-2">
            <div className="text-[12px] uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400 font-medium">Open issues</div>
            <div className="font-display text-[56px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
              {totalOpen}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">{agedIssues} aging {'>'} 7d</span>
              {agedIssuesDelta > 0 && (
                <span className={`font-mono text-[11px] flex items-center gap-0.5 text-signal-red`}>
                  ▲ {agedIssuesDelta} aged
                </span>
              )}
            </div>
          </div>

          {/* KPI 4 */}
          <div className="space-y-2">
            <div className="text-[12px] uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400 font-medium">Sites at risk</div>
            <div className="font-display text-[56px] leading-none tracking-tight text-signal-red">
              {sitesAtRisk.length}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400 truncate">
                {sitesAtRisk.length === 0 ? 'All sites healthy' : sitesAtRisk.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Middle 2-Column Section */}
      {/* ------------------------------------------------------------- */}
      <section className="grid grid-cols-3 gap-12">
        
        {/* Left Column (2/3): This week throughput */}
        <div className="col-span-2 space-y-6">
          <div className="flex items-end justify-between border-b hairline pb-4">
            <h2 className="font-display text-[20px] italic text-ink-900 dark:text-ink-50">This week</h2>
            <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400">
              {inspsThisWeek} inspections · {weeklyIssuesRaised} issues raised · {weeklyIssuesClosed} issues closed
            </div>
          </div>
          <div className="space-y-3">
            {throughputData.map((d: any) => {
              const dateObj = new Date(d.date)
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = d.date === todayStr
              const widthPct = maxThroughput > 0 ? (d.count / maxThroughput) * 100 : 0

              return (
                <div key={d.date} className="flex items-center gap-4">
                  <div className="w-12 font-mono text-[11px] text-ink-500 dark:text-ink-400 text-right">
                    {dayName}
                  </div>
                  <div className="flex-1 h-6 bg-ink-100 dark:bg-ink-800 rounded flex items-center relative">
                    <div 
                      className={`h-full rounded transition-all duration-500 ${isToday ? 'bg-accent-500' : 'bg-ink-900 dark:bg-ink-50'}`}
                      style={{ width: `${Math.max(widthPct, 2)}%` }} // 2% min width so it's visible even if 0 if we want? Actually 0 is 0
                    />
                    {/* Add min-width if 0 to show nothing, but we keep it clean */}
                  </div>
                  <div className="w-6 font-mono text-[12px] text-ink-900 dark:text-ink-50 font-medium">
                    {d.count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column (1/3): Needs attention */}
        <div className="col-span-1 space-y-6">
          <div className="border-b hairline pb-4">
            <h2 className="font-display text-[20px] italic text-ink-900 dark:text-ink-50">Needs attention</h2>
          </div>
          
          <div className="space-y-4">
            {attentionItems.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-8 h-8 rounded-full bg-signal-green/10 text-signal-green flex items-center justify-center">
                  <Icon name="check" className="w-4 h-4" />
                </div>
                <p className="text-[13px] text-ink-500 dark:text-ink-400">Nothing on your plate.</p>
              </div>
            ) : (
              attentionItems.map((item, idx) => (
                <button 
                  key={`${item.id}-${idx}`}
                  onClick={() => nav.push(item.to)}
                  className="w-full text-left group block p-3 -mx-3 rounded hover:bg-ink-50 dark:hover:bg-ink-900/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${item.tone === 'red' ? 'bg-signal-red' : 'bg-signal-amber'}`} />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 group-hover:text-accent-500 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">
                        {item.context}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Deep Dives */}
      {/* ------------------------------------------------------------- */}
      <section className="grid grid-cols-4 gap-4 pt-8 border-t hairline">
        <DeepDiveCard
          title="By site"
          count={new Set(inspections.map((i: any) => i.siteId)).size}
          tagline="Active sites"
          to="/exec/by_site"
        />
        <DeepDiveCard
          title="Trends"
          count={30} // 30 days
          tagline="Days of history"
          to="/exec/trends"
        />
        <DeepDiveCard
          title="Issues"
          count={totalOpen}
          tagline="Open issues"
          to="/exec/issues"
        />
        <DeepDiveCard
          title="Reports"
          count={inspections.filter((i: any) => i.status === 'published' || i.status === 'closed').length}
          tagline="Published reports"
          to="/exec/reports"
        />
      </section>

    </div>
  )
}

function DeepDiveCard({ title, count, tagline, to }: { title: string, count: number, tagline: string, to: string }) {
  const nav = useNav()
  return (
    <button 
      onClick={() => nav.push(to)}
      className="text-left p-5 rounded-lg border hairline bg-white dark:bg-ink-950 hover:border-ink-300 dark:hover:border-ink-700 transition-all group flex flex-col justify-between h-32"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[14px] text-ink-900 dark:text-ink-50">{title}</h3>
        <Icon name="chevron_right" className="w-4 h-4 text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors" />
      </div>
      <div>
        <div className="font-mono text-[20px] text-ink-900 dark:text-ink-50 mb-1">{count}</div>
        <div className="text-[12px] text-ink-500 dark:text-ink-400">{tagline}</div>
      </div>
    </button>
  )
}
