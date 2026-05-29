import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, flattenIssues } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import type { InspectionIssue, Inspection } from '../../../types/inspection'

export type IssueScope = 'all' | 'in_progress' | 'under_review' | 'closed' | 'in_area'

export function IssuesListPage({ scope }: { scope: IssueScope }) {
  const { user } = useSession()
  const nav = useNav()
  const { inspections } = useInspections()

  const { issues, title, metaLine, emptyTitle, emptyMsg } = useMemo(() => {
    if (!user) return { issues: [], title: <></>, metaLine: '', emptyTitle: '', emptyMsg: '' }

    const allIssues = flattenIssues(inspections)
    const assignedToMe = allIssues.filter((f: any) => f.issue.assigneeId === user.email)
    
    let filtered: { issue: InspectionIssue, inspection: Inspection }[] = []
    let titleContent = <></>
    let metaContent = ''
    let eTitle = ''
    let eMsg = ''

    if (scope === 'all') {
      filtered = assignedToMe.sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())
      titleContent = <>Your <span className="italic">actions</span>.</>
      metaContent = `${filtered.length} corrective action${filtered.length === 1 ? '' : 's'} assigned to you.`
      eTitle = 'No corrective actions yet.'
      eMsg = 'Issues assigned to you by your Quality or Safety Manager will appear here.'
    } else if (scope === 'in_progress') {
      filtered = assignedToMe.filter((f: any) => ['in_progress', 'reopened'].includes(f.issue.state))
      filtered.sort((a: any, b: any) => new Date(b.issue.updatedAt).getTime() - new Date(a.issue.updatedAt).getTime())
      titleContent = <>In <span className="italic">progress</span>.</>
      metaContent = `${filtered.length} corrective action${filtered.length === 1 ? '' : 's'} assigned to you.`
      eTitle = 'Nothing to do right now.'
      eMsg = "You're all caught up."
    } else if (scope === 'under_review') {
      filtered = assignedToMe.filter((f: any) => f.issue.state === 'awaiting_verification')
      filtered.sort((a: any, b: any) => new Date(b.issue.fixSubmittedAt || b.issue.updatedAt).getTime() - new Date(a.issue.fixSubmittedAt || a.issue.updatedAt).getTime())
      titleContent = <>Under <span className="italic">review</span>.</>
      metaContent = `${filtered.length} corrective action${filtered.length === 1 ? '' : 's'} awaiting your manager's verification.`
      eTitle = 'Nothing waiting on your manager.'
      eMsg = "Once you submit a fix, it'll appear here while your manager verifies."
    } else if (scope === 'closed') {
      filtered = assignedToMe.filter((f: any) => f.issue.state === 'closed')
      filtered.sort((a: any, b: any) => new Date(b.issue.verifiedAt || '').getTime() - new Date(a.issue.verifiedAt || '').getTime())
      titleContent = <>Closed.</>
      metaContent = `${filtered.length} closed corrective action${filtered.length === 1 ? '' : 's'}.`
      eTitle = 'No closed issues yet.'
      eMsg = 'Your completed corrective actions will appear here.'
    } else if (scope === 'in_area') {
      const myAreas = new Set(assignedToMe.map((f: any) => f.inspection.area).filter(Boolean))
      filtered = allIssues.filter((f: any) => f.inspection.area && myAreas.has(f.inspection.area))
      filtered.sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())
      titleContent = <>In your <span className="italic">area</span>.</>
      metaContent = `${filtered.length} recent issue${filtered.length === 1 ? '' : 's'} raised in your typical work areas.`
      eTitle = 'No issues in your area.'
      eMsg = "When inspectors raise issues at your usual work area, they'll appear here."
    }

    return { issues: filtered, title: titleContent, metaLine: metaContent, emptyTitle: eTitle, emptyMsg: eMsg }
  }, [inspections, user, scope])

  const sectionLabel = scope === 'all' ? 'My issues' : 
                       scope === 'in_progress' ? 'In progress' : 
                       scope === 'under_review' ? 'Under review' : 
                       scope === 'closed' ? 'Closed' : 'In my area'

  return (
    <div className="stagger max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400 mb-4">
          <span>Employee</span>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">{sectionLabel}</span>
        </div>
        
        <h1 className="font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
          {title}
        </h1>
        <p className="mt-2 text-[16px] text-ink-600 dark:text-ink-300">
          {metaLine}
        </p>
      </div>

      {/* List */}
      <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden shadow-sm">
        {issues.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border hairline border-dashed flex items-center justify-center mb-4 text-ink-400">
              <Icon name={scope === 'in_progress' ? 'check' : scope === 'closed' ? 'layers' : scope === 'in_area' ? 'home' : 'alert'} className="w-5 h-5" />
            </div>
            <h3 className="text-[15px] font-medium text-ink-900 dark:text-ink-50">{emptyTitle}</h3>
            <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[300px]">{emptyMsg}</p>
          </div>
        ) : (
          <div className="divide-y hairline">
            {issues.map(f => (
              <IssueRow key={f.issue.id} issue={f.issue} inspection={f.inspection} onClick={() => nav.push(`/emp/issues/${f.issue.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IssueRow({ issue, inspection, onClick }: { issue: InspectionIssue; inspection: Inspection; onClick: () => void }) {
  const ageMs = Date.now() - new Date(issue.createdAt).getTime()
  const isOld = ageMs > 7 * 86400000 && issue.state !== 'closed'

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      <div className="md:w-[40%] min-w-0">
        <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 mb-1">{issue.id}</div>
        <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 line-clamp-2">
          {issue.itemPrompt}
        </div>
      </div>
      
      <div className="md:w-[30%] min-w-0 text-[13px] text-ink-600 dark:text-ink-300">
        <div className="truncate">{inspection.number} · {inspection.templateName}</div>
        <div className="truncate mt-0.5">{inspection.siteName}{inspection.area ? ` · ${inspection.area}` : ''}</div>
      </div>

      <div className="md:w-[15%] shrink-0">
        <div className={`font-mono text-[12px] ${isOld ? 'text-signal-red' : 'text-ink-500 dark:text-ink-400'}`}>
          {formatRelativeTime(issue.createdAt)}
        </div>
      </div>

      <div className="md:w-[15%] shrink-0 flex items-center justify-between">
        <IssueStatePill state={issue.state} />
        <Icon name="chevron_right" className="w-4 h-4 text-ink-400 opacity-0 -ml-4 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  )
}
