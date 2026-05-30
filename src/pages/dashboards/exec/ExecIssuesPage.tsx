import { useState, useMemo } from 'react'
import {
  useInspections,
  flattenIssues,
  formatDate
} from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import { Avatar } from '../../../components/primitives/Avatar'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { PageBanner } from '../../../components/shell/PageBanner'

type DomainFilter = 'all' | 'quality' | 'safety'
type Grouping = 'flat' | 'site'

export function ExecIssuesPage() {
  const { inspections } = useInspections()
  const { templates } = useTemplates()
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [grouping, setGrouping] = useState<Grouping>('flat')

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const allIssues = useMemo(() => flattenIssues(inspections), [inspections])
  const filtered = useMemo(() => {
    return allIssues.filter((f: any) => domain === 'all' || f.inspection.domain === domain)
  }, [allIssues, domain])

  // KPIs
  const openCount = filtered.filter((f: any) => ['open', 'in_progress', 'reopened'].includes(f.issue.state)).length
  const awaitingCount = filtered.filter((f: any) => f.issue.state === 'awaiting_verification').length
  const agedCount = filtered.filter((f: any) => 
    ['open', 'in_progress', 'reopened'].includes(f.issue.state) && 
    (Date.now() - new Date(f.issue.createdAt).getTime()) / 86400000 > 7
  ).length
  const closedThisMonth = filtered.filter((f: any) => 
    f.issue.state === 'closed' && 
    f.issue.verifiedAt && 
    (Date.now() - new Date(f.issue.verifiedAt).getTime()) / 86400000 <= 30
  ).length

  // Display data
  const groups = useMemo(() => {
    let sorted = [...filtered].sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())
    
    if (grouping === 'flat') {
      return [{ title: 'All issues', issues: sorted }]
    } else {
      const siteMap = new Map<string, { title: string, count: number, issues: typeof sorted }>()
      sorted.forEach((f: any) => {
        const siteName = f.inspection.siteName
        if (!siteMap.has(siteName)) {
          siteMap.set(siteName, { title: siteName, count: 0, issues: [] })
        }
        siteMap.get(siteName)!.issues.push(f)
      })
      const arr = Array.from(siteMap.values())
      arr.sort((a, b) => a.title.localeCompare(b.title))
      return arr
    }
  }, [filtered, grouping])

  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
        Top Management &gt; Issues
      </div>

      {/* Page Banner with nested filter and layout controls */}
      <PageBanner
        title="Executive Issues Log"
        subline={`${filtered.length} total issues · last refreshed ${timeStr}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Domain Filter */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
              {(['all', 'quality', 'safety'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all ${ domain === d ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Layout Grouping */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setGrouping('flat')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${ grouping === 'flat' ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
              >
                Flat List
              </button>
              <button
                onClick={() => setGrouping('site')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${ grouping === 'site' ? 'bg-warning text-text-primary shadow-sm' : 'text-white hover:text-warning' }`}
              >
                Grouped
              </button>
            </div>
          </div>
        }
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Open Issues" count={openCount} />
        <KpiCard title="Awaiting Review" count={awaitingCount} />
        <KpiCard title="Aging > 7 days" count={agedCount} tone="red" />
        <KpiCard title="Closed (30 days)" count={closedThisMonth} />
      </div>

      {/* List content */}
      <div className="space-y-8">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            {grouping === 'site' && (
              <h2 className="text-[15px] font-bold text-text-primary pb-2 border-b border-text-secondary/15 flex items-center justify-between">
                <span>{group.title}</span>
                <span className="text-[11px] font-mono text-text-secondary">{group.issues.length} issues</span>
              </h2>
            )}
            
            <div className="rounded-2xl bg-white border border-text-secondary/15 shadow-soft overflow-hidden">
              {group.issues.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-text-secondary">
                  No issues to display.
                </div>
              ) : (
                <div className="divide-y divide-text-secondary/15">
                  {group.issues.map((f: any) => {
                    const isExpanded = expandedIssue === f.issue.id
                    const template = templates.find((t: any) => t.id === f.inspection.templateId)
                    const originalItem = template?.sections.flatMap((s: any) => s.items).find((i: any) => i.id === f.issue.itemId)
                    
                    return (
                      <div key={f.issue.id} className="group">
                        {/* Row */}
                        <div 
                          className="p-4 flex items-center hover:bg-accent-light/50 transition-colors cursor-pointer"
                          onClick={() => setExpandedIssue(isExpanded ? null : f.issue.id)}
                        >
                          <div className="w-24 shrink-0 font-mono text-[11px] text-text-secondary">{f.issue.id}</div>
                          <div className="flex-1 pr-4 min-w-0">
                            <div className="text-[13px] font-semibold text-text-primary truncate">{f.issue.itemPrompt}</div>
                            <div className="text-[11px] text-text-secondary mt-0.5 truncate">
                              {f.inspection.siteName} {f.inspection.area && `· ${f.inspection.area}`}
                            </div>
                          </div>
                          <div className="w-48 shrink-0 flex items-center gap-3">
                            <Avatar name={f.issue.assigneeName || 'Unknown'} />
                            <div className="min-w-0">
                              <div className="text-[12px] font-bold text-text-primary truncate">{f.issue.assigneeName || 'Unassigned'}</div>
                              <div className="text-[10px] text-text-secondary truncate">Assignee</div>
                            </div>
                          </div>
                          <div className="w-32 shrink-0">
                            <IssueStatePill state={f.issue.state} />
                          </div>
                          <div className="w-8 shrink-0 flex justify-end">
                            <Icon name={isExpanded ? 'chevron_down' : 'chevron_right'} className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
                          </div>
                        </div>

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <div className="bg-accent-light/50 p-6 border-t border-text-secondary/15 animate-fade-up">
                            <div className="grid grid-cols-2 gap-8">
                              {/* Left: Context */}
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">FINDING</div>
                                  <div className="text-[13px] text-text-primary font-medium">
                                    {originalItem?.prompt || f.issue.itemPrompt}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">PARENT INSPECTION</div>
                                  <div className="text-[13px] text-text-primary font-bold">
                                    {f.inspection.number}
                                  </div>
                                  <div className="text-[12px] text-text-secondary">
                                    {f.inspection.templateName}
                                  </div>
                                </div>
                                {f.issue.fixNotes && (
                                  <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">FIX NOTES</div>
                                    <div className="p-3 bg-white rounded-xl border border-text-secondary/15 text-[13px] text-text-primary">
                                      {f.issue.fixNotes}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right: Timeline */}
                              <div className="space-y-3">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">TIMELINE</div>
                                <div className="relative pl-4 border-l border-text-secondary/15 space-y-4">
                                  {[...f.inspection.timeline]
                                    .filter((e: any) => e.target === f.issue.id || (e.action === 'issue_created' && e.at === f.issue.createdAt))
                                    .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())
                                    .map((e: any) => (
                                      <div key={e.id} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-text-secondary/15" />
                                        <div className="text-[12px] font-bold text-text-primary">
                                          {formatEventAction(e.action)}
                                        </div>
                                        <div className="text-[11px] text-text-secondary mt-0.5">
                                          by {e.actorName} · {formatDate(e.at)}
                                        </div>
                                        {e.note && (
                                          <div className="mt-1 text-[12px] text-text-primary bg-white px-2.5 py-1 rounded-lg border border-text-secondary/15 inline-block">
                                            {e.note}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiCard({ title, count, tone }: { title: string, count: number, tone?: 'red' }) {
  const valueColor = tone === 'red' && count > 0 ? 'text-status-fail' : 'text-text-primary'
  return (
    <div className="bg-white border border-text-secondary/15 rounded-2xl p-5 shadow-soft">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{title}</div>
      <div className={`mt-2 text-[32px] font-bold tracking-tight leading-none ${valueColor}`}>
        {count}
      </div>
    </div>
  )
}

function formatEventAction(action: string) {
  switch (action) {
    case 'issue_created': return 'Issue raised'
    case 'issue_fix_submitted': return 'Fix submitted'
    case 'issue_verified': return 'Fix verified'
    case 'issue_reopened': return 'Issue reopened'
    case 'issue_reassigned': return 'Issue reassigned'
    default: return action
  }
}
