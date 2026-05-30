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
import { PageBanner } from '../../../components/shell/PageBanner'

type DomainFilter = 'all' | 'quality' | 'safety'

export function OverviewPage() {
  const { user } = useSession()
  const { inspections } = useInspections()
  const nav = useNav()
  const [domain, setDomain] = useState<DomainFilter>('all')

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Executive'
  const h = new Date().getHours()
  const timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'

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
  const agedIssuesDelta = agedIssues - computeAgingIssues(inspections, 14, domain)

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

  // Throughput calculations
  const throughputData = computeThroughput(inspections, 7, domain)
  const maxThroughput = Math.max(1, ...throughputData.map((d: any) => d.count))
  const todayStr = new Date().toISOString().split('T')[0]

  // Attention items
  const attentionItems: { id: string, title: string, context: string, tone: 'red' | 'amber', to: string }[] = []

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

  if (throughputDown) {
    attentionItems.push({
      id: 'throughput',
      title: `Throughput dropped ${Math.abs(inspDelta)}%`,
      context: `Only ${inspsThisWeek} inspections this week vs ${inspsLastWeek} last week.`,
      tone: 'amber',
      to: '/exec/trends'
    })
  }

  const execKpis = [
    {
      label: 'Inspections',
      value: inspsThisWeek.toString(),
      sublabel: `vs ${inspsLastWeek} last week`,
      trend: inspDelta !== 0 ? `${inspDelta > 0 ? '+' : ''}${inspDelta}%` : undefined,
      trendTone: inspDelta >= 0 ? 'text-status-pass' : 'text-status-fail',
      accent: 'bg-primary'
    },
    {
      label: 'Compliance',
      value: `${comp30d}%`,
      sublabel: 'last 30 days compliance',
      trend: compDelta !== 0 ? `${compDelta > 0 ? '+' : ''}${compDelta}pt` : undefined,
      trendTone: compDelta >= 0 ? 'text-status-pass' : 'text-status-fail',
      accent: 'bg-status-pass'
    },
    {
      label: 'Open issues',
      value: totalOpen.toString(),
      sublabel: `${agedIssues} aging > 7 days`,
      trend: agedIssuesDelta > 0 ? `+${agedIssuesDelta} aged` : undefined,
      trendTone: 'text-status-fail',
      accent: 'bg-warning'
    },
    {
      label: 'Sites at risk',
      value: sitesAtRisk.length.toString(),
      sublabel: sitesAtRisk.length === 0 ? 'All sites healthy' : sitesAtRisk.join(', '),
      trend: undefined,
      trendTone: '',
      accent: 'bg-status-fail'
    }
  ]

  const domainTabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'quality' as const, label: 'Quality' },
    { key: 'safety' as const, label: 'Safety' }
  ]

  return (
    <div className="space-y-6">
      <PageBanner
        title={`Good ${timeOfDay}, ${firstName}.`}
        subline={subheading}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              Export report
            </button>
            <button 
              onClick={() => nav.push('/exec/trends')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              View trends
            </button>
          </>
        }
      />

      {/* Domain filter segmented pills */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl">
          {domainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDomain(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition ${ domain === tab.key ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 BIG hero KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {execKpis.map((kpi) => (
          <div key={kpi.label} className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-6 lg:p-7 overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${kpi.accent}`} aria-hidden="true" />
            <div className="pl-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-3">
                {kpi.label}
              </div>
              <div className="font-mono text-[44px] lg:text-[52px] font-bold text-text-primary leading-none">
                {kpi.value}
              </div>
              <div className="mt-4 flex items-baseline justify-between font-sans">
                <div className="text-[12px] text-text-secondary truncate">{kpi.sublabel}</div>
                {kpi.trend && (
                  <div className={`inline-flex items-center gap-0.5 text-[12px] font-mono font-bold shrink-0 ${kpi.trendTone}`}>
                    {kpi.trend.startsWith('+') ? '▲' : '▼'} {kpi.trend}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Throughput chart panel */}
        <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-1">
            This week
          </div>
          <div className="text-[18px] font-bold text-text-primary mb-5">
            Inspection throughput
          </div>
          
          <div className="space-y-4">
            {throughputData.map((d: any) => {
              const dateObj = new Date(d.date)
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = d.date === todayStr
              const widthPct = maxThroughput > 0 ? (d.count / maxThroughput) * 100 : 0

              return (
                <div key={d.date} className="flex items-center gap-4">
                  <div className="w-12 font-mono text-[13px] text-text-secondary text-right">
                    {dayName}
                  </div>
                  <div className="flex-1 h-6 bg-accent-light rounded-lg overflow-hidden flex items-center relative">
                    <div 
                      className={`h-full rounded-lg transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-primary'}`}
                      style={{ width: `${Math.max(widthPct, 2)}%` }}
                    />
                  </div>
                  <div className="w-6 font-mono text-[13px] text-text-primary font-bold">
                    {d.count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Needs attention panel */}
        <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-1">
            Attention required
          </div>
          <div className="text-[18px] font-bold text-text-primary mb-5">
            Key operational items
          </div>
          
          <div className="space-y-3">
            {attentionItems.length === 0 ? (
              <p className="text-[13px] text-text-secondary">All systems green.</p>
            ) : (
              attentionItems.map((item, idx) => (
                <button 
                  key={`${item.id}-${idx}`}
                  onClick={() => nav.push(item.to)}
                  className="w-full text-left p-3 rounded-xl border border-text-secondary/15 hover:bg-accent-light transition flex items-start gap-3"
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.tone === 'red' ? 'bg-status-fail' : 'bg-warning'}`} />
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[12px] text-text-secondary mt-0.5">
                      {item.context}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4 deep-dive cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'By site', to: '/exec/by_site', desc: 'Performance mapping' },
          { label: 'Trends', to: '/exec/trends', desc: 'Compliance history' },
          { label: 'Issues', to: '/exec/issues', desc: 'Corrective actions' },
          { label: 'Reports', to: '/exec/reports', desc: 'Published audits' }
        ].map((c) => (
          <button 
            key={c.label}
            onClick={() => nav.push(c.to)}
            className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-5 text-left hover:shadow-lift transition flex flex-col justify-between h-32 group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-[15px] font-bold text-text-primary">{c.label}</div>
              <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-[12px] text-text-secondary">
              {c.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
