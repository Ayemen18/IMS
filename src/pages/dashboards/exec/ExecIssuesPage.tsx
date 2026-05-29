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
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 uppercase tracking-widest">
            Top Management {'>'} Issues
          </div>
          <div>
            <h1 className="font-display text-[40px] leading-tight text-ink-900 dark:text-ink-50">
              <span className="italic">Issues</span> log.
            </h1>
            <p className="text-[14px] text-ink-500 dark:text-ink-400 mt-2 font-mono">
              {filtered.length} total issues · last refreshed {timeStr}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
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
          <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-md">
            <button
              onClick={() => setGrouping('flat')}
              className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                grouping === 'flat' 
                  ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20' 
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              Flat list
            </button>
            <button
              onClick={() => setGrouping('site')}
              className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                grouping === 'site' 
                  ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20' 
                  : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              Grouped by site
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Open issues" count={openCount} />
        <KpiCard title="Awaiting review" count={awaitingCount} />
        <KpiCard title="Aging > 7d" count={agedCount} tone="red" />
        <KpiCard title="Closed (30d)" count={closedThisMonth} />
      </div>

      {/* List */}
      <div className="space-y-8">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-4">
            {grouping === 'site' && (
              <h2 className="font-display text-[24px] italic text-ink-900 dark:text-ink-50 pb-2 border-b hairline">
                {group.title} <span className="text-[14px] font-mono text-ink-400 normal-case ml-2">{group.issues.length} issues</span>
              </h2>
            )}
            
            <div className="bg-white dark:bg-ink-950 border hairline rounded-lg overflow-hidden">
              {group.issues.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-ink-500 dark:text-ink-400">
                  No issues to display.
                </div>
              ) : (
                <div className="divide-y hairline">
                  {group.issues.map((f: any) => {
                    const isExpanded = expandedIssue === f.issue.id
                    const template = templates.find((t: any) => t.id === f.inspection.templateId)
                    const originalItem = template?.sections.flatMap((s: any) => s.items).find((i: any) => i.id === f.issue.itemId)
                    
                    return (
                      <div key={f.issue.id} className="group">
                        {/* Row */}
                        <div 
                          className="p-4 flex items-center hover:bg-ink-50 dark:hover:bg-ink-900/20 transition-colors cursor-pointer"
                          onClick={() => setExpandedIssue(isExpanded ? null : f.issue.id)}
                        >
                          <div className="w-24 shrink-0 font-mono text-[11px] text-ink-500 dark:text-ink-400">{f.issue.id}</div>
                          <div className="flex-1 pr-4 min-w-0">
                            <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 truncate">{f.issue.itemPrompt}</div>
                            <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                              {f.inspection.siteName} {f.inspection.area && `· ${f.inspection.area}`}
                            </div>
                          </div>
                          <div className="w-48 shrink-0 flex items-center gap-3">
                            <Avatar name={f.issue.assigneeName || 'Unknown'} />
                            <div className="min-w-0">
                              <div className="text-[12px] font-medium text-ink-900 dark:text-ink-50 truncate">{f.issue.assigneeName || 'Unassigned'}</div>
                              <div className="text-[11px] text-ink-500 dark:text-ink-400 truncate">Assignee</div>
                            </div>
                          </div>
                          <div className="w-32 shrink-0">
                            <IssueStatePill state={f.issue.state} />
                          </div>
                          <div className="w-8 shrink-0 flex justify-end">
                            <Icon name={isExpanded ? 'chevron_down' : 'chevron_right'} className="w-5 h-5 text-ink-300 dark:text-ink-600 group-hover:text-ink-500 dark:group-hover:text-ink-400 transition-transform" />
                          </div>
                        </div>

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <div className="bg-ink-50 dark:bg-ink-900/30 p-6 border-t hairline animate-fade-up">
                            <div className="grid grid-cols-2 gap-12">
                              {/* Left: Context */}
                              <div className="space-y-6">
                                <div className="space-y-1">
                                  <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400">FINDING</div>
                                  <div className="text-[14px] text-ink-900 dark:text-ink-50">
                                    {originalItem?.prompt || f.issue.itemPrompt}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400">PARENT INSPECTION</div>
                                  <div className="text-[13px] text-ink-900 dark:text-ink-50 font-medium">
                                    {f.inspection.number}
                                  </div>
                                  <div className="text-[12px] text-ink-500 dark:text-ink-400">
                                    {f.inspection.templateName}
                                  </div>
                                </div>
                                {f.issue.fixNotes && (
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400">FIX NOTES</div>
                                    <div className="p-3 bg-white dark:bg-ink-950 rounded border hairline text-[13px] text-ink-900 dark:text-ink-50">
                                      {f.issue.fixNotes}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right: Timeline */}
                              <div className="space-y-4">
                                <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400">TIMELINE</div>
                                <div className="relative pl-4 border-l hairline space-y-6">
                                  {[...f.inspection.timeline]
                                    .filter((e: any) => e.target === f.issue.id || (e.action === 'issue_created' && e.at === f.issue.createdAt))
                                    .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())
                                    .map((e: any) => (
                                      <div key={e.id} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white dark:bg-ink-950 border-2 border-ink-300 dark:border-ink-600" />
                                        <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">
                                          {formatEventAction(e.action)}
                                        </div>
                                        <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5">
                                          by {e.actorName} · {formatDate(e.at)}
                                        </div>
                                        {e.note && (
                                          <div className="mt-1.5 text-[13px] text-ink-700 dark:text-ink-300 bg-white dark:bg-ink-950 px-2.5 py-1.5 rounded border hairline inline-block">
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
  return (
    <div className="bg-white dark:bg-ink-950 border hairline rounded-lg p-5">
      <div className="text-[11px] font-mono text-ink-500 dark:text-ink-400 uppercase">{title}</div>
      <div className={`mt-2 font-display text-[32px] leading-none ${tone === 'red' && count > 0 ? 'text-signal-red' : 'text-ink-900 dark:text-ink-50'}`}>
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
