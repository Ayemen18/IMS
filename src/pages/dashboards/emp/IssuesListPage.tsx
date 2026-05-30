import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, flattenIssues } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import type { InspectionIssue, Inspection } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

export type IssueScope = 'all' | 'in_progress' | 'under_review' | 'closed' | 'in_area'

export function IssuesListPage({ scope }: { scope: IssueScope }) {
  const { user } = useSession()
  const nav = useNav()
  const { inspections } = useInspections()

  const { issues, title, metaLine, emptyTitle, emptyMsg } = useMemo(() => {
    if (!user) return { issues: [], title: '', metaLine: '', emptyTitle: '', emptyMsg: '' }

    const allIssues = flattenIssues(inspections)
    const assignedToMe = allIssues.filter((f: any) => f.issue.assigneeId === user.email)
    
    let filtered: { issue: InspectionIssue, inspection: Inspection }[] = []
    let titleContent = ''
    let metaContent = ''
    let eTitle = ''
    let eMsg = ''

    if (scope === 'all') {
      filtered = assignedToMe.sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())
      titleContent = 'Your actions'
      metaContent = `${filtered.length} corrective action${filtered.length === 1 ? '' : 's'} assigned to you.`
      eTitle = 'No corrective actions yet.'
      eMsg = 'Issues assigned to you by your Quality or Safety Manager will appear here.'
    } else if (scope === 'in_progress') {
      filtered = assignedToMe.filter((f: any) => ['in_progress', 'reopened'].includes(f.issue.state))
      filtered.sort((a: any, b: any) => new Date(b.issue.updatedAt).getTime() - new Date(a.issue.updatedAt).getTime())
      titleContent = 'In progress'
      metaContent = `${filtered.length} corrective action${filtered.length === 1 ? '' : 's'} assigned to you.`
      eTitle = 'Nothing to do right now.'
      eMsg = "You're all caught up."
    } else if (scope === 'under_review') {
      filtered = assignedToMe.filter((f: any) => f.issue.state === 'awaiting_verification')
      filtered.sort((a: any, b: any) => new Date(b.issue.fixSubmittedAt || b.issue.updatedAt).getTime() - new Date(a.issue.fixSubmittedAt || a.issue.updatedAt).getTime())
      titleContent = 'Under review'
      metaContent = `${filtered.length} corrective action${filtered.length === 1 ? '' : 's'} awaiting your manager's verification.`
      eTitle = 'Nothing waiting on your manager.'
      eMsg = "Once you submit a fix, it will appear here while your manager verifies."
    } else if (scope === 'closed') {
      filtered = assignedToMe.filter((f: any) => f.issue.state === 'closed')
      filtered.sort((a: any, b: any) => new Date(b.issue.verifiedAt || '').getTime() - new Date(a.issue.verifiedAt || '').getTime())
      titleContent = 'Closed'
      metaContent = `${filtered.length} closed corrective action${filtered.length === 1 ? '' : 's'}.`
      eTitle = 'No closed issues yet.'
      eMsg = 'Your completed corrective actions will appear here.'
    } else if (scope === 'in_area') {
      const myAreas = new Set(assignedToMe.map((f: any) => f.inspection.area).filter(Boolean))
      filtered = allIssues.filter((f: any) => f.inspection.area && myAreas.has(f.inspection.area))
      filtered.sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())
      titleContent = 'In your area'
      metaContent = `${filtered.length} recent issue${filtered.length === 1 ? '' : 's'} raised in your typical work areas.`
      eTitle = 'No issues in your area.'
      eMsg = "When inspectors raise issues at your usual work area, they will appear here."
    }

    return { issues: filtered, title: titleContent, metaLine: metaContent, emptyTitle: eTitle, emptyMsg: eMsg }
  }, [inspections, user, scope])

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageBanner
        title={title}
        subline={metaLine}
      />

      {/* List */}
      <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
        {issues.length === 0 ? (
          <div className="px-6 py-20 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4 text-text-secondary">
              <Icon name={scope === 'in_progress' ? 'check' : scope === 'closed' ? 'layers' : scope === 'in_area' ? 'home' : 'alert'} className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary mb-1">{emptyTitle}</h3>
            <p className="text-[13px] text-text-secondary max-w-[360px] mx-auto">{emptyMsg}</p>
          </div>
        ) : (
          <div className="divide-y divide-text-secondary/15">
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
      className="w-full px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 text-left hover:bg-accent-light transition group"
    >
      <div className="md:w-[40%] min-w-0">
        <div className="font-mono text-[11px] text-text-secondary mb-1">{issue.id}</div>
        <div className="text-[14px] font-semibold text-text-primary line-clamp-2">
          {issue.itemPrompt}
        </div>
      </div>
      
      <div className="md:w-[30%] min-w-0 text-[13px] text-text-secondary">
        <div className="truncate font-semibold text-text-primary">{inspection.number} · {inspection.templateName}</div>
        <div className="truncate mt-0.5">{inspection.siteName}{inspection.area ? ` · ${inspection.area}` : ''}</div>
      </div>

      <div className="md:w-[15%] shrink-0">
        <div className={`font-mono text-[12px] ${isOld ? 'text-status-fail font-semibold' : 'text-text-secondary'}`}>
          {formatRelativeTime(issue.createdAt)}
        </div>
      </div>

      <div className="md:w-[15%] shrink-0 flex items-center justify-between">
        <IssueStatePill state={issue.state} />
        <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}
