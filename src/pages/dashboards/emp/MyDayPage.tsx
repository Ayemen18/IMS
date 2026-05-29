import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, flattenIssues } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import type { InspectionIssue, Inspection } from '../../../types/inspection'

function greetByHour() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function MyDayPage() {
  const { user } = useSession()
  const nav = useNav()
  const { inspections } = useInspections()

  const {
    myIssues,
    inProgressNext,
    awaitingReview,
    recentlyClosed,
    inAreaIssues,
    recentActivity,
  } = useMemo(() => {
    if (!user) {
      return { myIssues: [], inProgressNext: null, awaitingReview: [], recentlyClosed: [], inAreaIssues: [], recentActivity: [] }
    }

    const allIssues = flattenIssues(inspections)
    
    // 1. My Issues
    const assignedToMe = allIssues.filter((f: any) => f.issue.assigneeId === user.email)
    
    // Active issues to display in "Your actions" (in_progress, reopened, awaiting_verification)
    const myIssues = assignedToMe
      .filter((f: any) => ['in_progress', 'reopened', 'awaiting_verification'].includes(f.issue.state))
      .sort((a: any, b: any) => {
        const priority = { in_progress: 0, reopened: 1, awaiting_verification: 2 }
        const pa = priority[a.issue.state as keyof typeof priority] ?? 99
        const pb = priority[b.issue.state as keyof typeof priority] ?? 99
        if (pa !== pb) return pa - pb
        // then by newest
        return new Date(b.issue.updatedAt).getTime() - new Date(a.issue.updatedAt).getTime()
      })

    const inProgressNext = assignedToMe.find((f: any) => f.issue.state === 'in_progress' || f.issue.state === 'reopened')

    const awaitingReview = assignedToMe
      .filter((f: any) => f.issue.state === 'awaiting_verification')
      .sort((a: any, b: any) => new Date(b.issue.fixSubmittedAt || b.issue.updatedAt).getTime() - new Date(a.issue.fixSubmittedAt || a.issue.updatedAt).getTime())

    const last7 = Date.now() - 7 * 86400000
    const recentlyClosed = assignedToMe
      .filter((f: any) => f.issue.state === 'closed' && f.issue.verifiedAt && new Date(f.issue.verifiedAt).getTime() > last7)
      .sort((a: any, b: any) => new Date(b.issue.verifiedAt || '').getTime() - new Date(a.issue.verifiedAt || '').getTime())

    // 2. In My Area
    // Heuristic: areas where this user has EVER had an issue
    const myAreas = new Set(assignedToMe.map((f: any) => f.inspection.area).filter(Boolean))
    const inAreaIssues = allIssues
      .filter((f: any) => f.inspection.area && myAreas.has(f.inspection.area) && new Date(f.issue.createdAt).getTime() > last7)
      .sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())

    // 3. Recent Activity
    // Events on inspections where she has issues assigned, or events on her own issues directly.
    const relevantInspectionIds = new Set(assignedToMe.map((f: any) => f.inspection.id))
    const recentActivity = inspections
      .filter((i: any) => relevantInspectionIds.has(i.id))
      .flatMap((i: any) => i.timeline.map((e: any) => ({ event: e, inspection: i })))
      .sort((a: any, b: any) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime())
      .slice(0, 6)

    return { myIssues, inProgressNext, awaitingReview, recentlyClosed, inAreaIssues, recentActivity }
  }, [inspections, user])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Employee'

  const subheading = useMemo(() => {
    const activeCount = myIssues.filter((f: any) => f.issue.state === 'in_progress' || f.issue.state === 'reopened').length
    const reviewCount = awaitingReview.length

    if (activeCount > 0 && reviewCount > 0) {
      return `${activeCount} corrective action${activeCount === 1 ? '' : 's'} assigned to you · ${reviewCount} awaiting your manager's verification.`
    }
    if (activeCount > 0) {
      return `${activeCount} corrective action${activeCount === 1 ? '' : 's'} assigned to you.`
    }
    if (reviewCount > 0) {
      return `${reviewCount} corrective action${reviewCount === 1 ? '' : 's'} awaiting your manager's verification.`
    }
    return `No corrective actions assigned right now.`
  }, [myIssues, awaitingReview])

  return (
    <div className="stagger max-w-[1000px] mx-auto pb-12">
      {/* Hero header */}
      <div className="mb-8">
        <h1 className="font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
          {greetByHour()}, <span className="italic text-ink-500 dark:text-ink-400">{firstName}</span>.
        </h1>
        <p className="mt-1 text-[16px] text-ink-600 dark:text-ink-300">
          {subheading}
        </p>
        <div className="mt-5">
          {inProgressNext ? (
            <button
              onClick={() => nav.push(`/emp/issues/${inProgressNext.issue.id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-[14px] font-medium hover:bg-accent-600 transition-colors"
            >
              Open your next action
              <Icon name="arrow_right" className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border hairline bg-transparent text-[14px] font-medium text-ink-400 dark:text-ink-600 cursor-not-allowed"
            >
              No actions assigned
            </button>
          )}
        </div>
      </div>

      {/* Your actions */}
      <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden mb-8 shadow-sm">
        <div className="px-6 py-5 border-b hairline">
          <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
            Your actions
          </div>
        </div>
        {myIssues.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border hairline border-dashed flex items-center justify-center">
              <Icon name="check" className="w-5 h-5 text-signal-green" />
            </div>
            <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
              You're all clear.
            </div>
            <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
              When your Quality or Safety Manager assigns you a corrective action, it'll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y hairline">
            {myIssues.map((f: any) => (
              <ActionRow 
                key={f.issue.id} 
                issue={f.issue} 
                inspection={f.inspection} 
                onClick={() => nav.push(`/emp/issues/${f.issue.id}`)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* 3 smaller cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Awaiting your manager */}
        <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Awaiting your manager</h3>
            {awaitingReview.length > 0 && <span className="text-[12px] text-ink-500 dark:text-ink-400">{awaitingReview.length} total</span>}
          </div>
          {awaitingReview.length === 0 ? (
            <p className="text-[13px] text-ink-500 dark:text-ink-400">Nothing waiting on review.</p>
          ) : (
            <div className="space-y-4">
              {awaitingReview.slice(0, 2).map((f: any) => (
                <button key={f.issue.id} onClick={() => nav.push(`/emp/issues/${f.issue.id}`)} className="block w-full text-left group">
                  <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">{f.issue.id}</div>
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5 truncate">{f.issue.itemPrompt}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">Submitted {formatRelativeTime(f.issue.fixSubmittedAt || f.issue.updatedAt)}</div>
                </button>
              ))}
              {awaitingReview.length > 2 && (
                <button onClick={() => nav.push(`/emp/under_review`)} className="text-[12px] text-ink-600 dark:text-ink-300 font-medium hover:text-ink-900 dark:hover:text-ink-50">
                  +{awaitingReview.length - 2} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recently closed */}
        <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Recently closed</h3>
            {recentlyClosed.length > 0 && <span className="text-[12px] text-ink-500 dark:text-ink-400">{recentlyClosed.length} total</span>}
          </div>
          {recentlyClosed.length === 0 ? (
            <p className="text-[13px] text-ink-500 dark:text-ink-400">No issues closed recently.</p>
          ) : (
            <div className="space-y-4">
              {recentlyClosed.slice(0, 2).map((f: any) => (
                <button key={f.issue.id} onClick={() => nav.push(`/emp/issues/${f.issue.id}`)} className="block w-full text-left group">
                  <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">{f.issue.id}</div>
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5 truncate">{f.issue.itemPrompt}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">Closed {formatRelativeTime(f.issue.verifiedAt || f.issue.updatedAt)}</div>
                </button>
              ))}
              {recentlyClosed.length > 2 && (
                <button onClick={() => nav.push(`/emp/closed`)} className="text-[12px] text-ink-600 dark:text-ink-300 font-medium hover:text-ink-900 dark:hover:text-ink-50">
                  +{recentlyClosed.length - 2} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* In your area */}
        <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50">In your area</h3>
            {inAreaIssues.length > 0 && <span className="text-[12px] text-ink-500 dark:text-ink-400">{inAreaIssues.length} total</span>}
          </div>
          {inAreaIssues.length === 0 ? (
            <p className="text-[13px] text-ink-500 dark:text-ink-400">No area set.</p>
          ) : (
            <div className="space-y-4">
              {inAreaIssues.slice(0, 2).map((f: any) => (
                <button key={f.issue.id} onClick={() => nav.push(`/emp/issues/${f.issue.id}`)} className="block w-full text-left group">
                  <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">{f.issue.id}</div>
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5 truncate">{f.issue.itemPrompt}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">{f.inspection.area}</div>
                </button>
              ))}
              {inAreaIssues.length > 2 && (
                <button onClick={() => nav.push(`/emp/in_area`)} className="text-[12px] text-ink-600 dark:text-ink-300 font-medium hover:text-ink-900 dark:hover:text-ink-50">
                  +{inAreaIssues.length - 2} more
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-4 px-2">Recent activity</h3>
        <div className="space-y-1 px-2">
          {recentActivity.length === 0 ? (
            <p className="text-[12px] text-ink-500 dark:text-ink-400 py-2">No recent activity.</p>
          ) : (
            recentActivity.map(({ event, inspection }: any) => (
              <button
                key={event.id}
                onClick={() => nav.push(event.target ? `/emp/issues/${event.target}` : `/emp`)}
                className="w-full flex items-start gap-3 text-[12px] hover:bg-ink-50 dark:hover:bg-ink-800/60 -mx-2 px-2 py-1.5 rounded transition-colors text-left group"
              >
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotForAction(event.action)}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-ink-900 dark:text-ink-50 font-medium">{event.byName}</span>
                  <span className="text-ink-500 dark:text-ink-400"> {actionToText(event.action)} </span>
                  {event.target ? (
                    <span className="text-ink-900 dark:text-ink-50 font-mono font-medium">{event.target}</span>
                  ) : (
                    <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.number}</span>
                  )}
                  {event.note && (
                    <div className="mt-0.5 text-ink-600 dark:text-ink-300 line-clamp-1 italic">"{event.note}"</div>
                  )}
                  <div className="mt-1 text-[10px] text-ink-400 dark:text-ink-500">
                    {formatRelativeTime(event.at)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ActionRow({ issue, inspection, onClick }: { issue: InspectionIssue; inspection: Inspection; onClick: () => void }) {
  let actionLabel = 'Open'
  if (issue.state === 'reopened') actionLabel = 'Open (reopened)'
  else if (issue.state === 'awaiting_verification') actionLabel = 'View status'

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      <div className="sm:w-20 shrink-0">
        <div className="font-mono text-[13px] text-ink-500 dark:text-ink-400 tracking-tight">{issue.id}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink-900 dark:text-ink-50 truncate">
          {issue.itemPrompt}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <div className="text-[13px] text-ink-500 dark:text-ink-400 truncate">
            {inspection.number} · {inspection.templateName} {inspection.area ? `· ${inspection.area}` : ''}
          </div>
          <IssueStatePill state={issue.state} />
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent-600 dark:text-accent-400 group-hover:text-accent-700 dark:group-hover:text-accent-300 transition-colors">
          {actionLabel}
          <Icon name="arrow_right" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  )
}

function dotForAction(action: string) {
  if (action === 'issue_created' || action === 'rejected' || action === 'issue_reopened') return 'bg-signal-red'
  if (action === 'submitted' || action === 'issue_fix_submitted') return 'bg-signal-amber'
  if (action === 'published' || action === 'approved' || action === 'issue_verified') return 'bg-signal-green'
  return 'bg-ink-300 dark:bg-ink-600'
}

function actionToText(action: string) {
  switch (action) {
    case 'scheduled': return 'scheduled'
    case 'started': return 'started'
    case 'submitted': return 'submitted draft for'
    case 'approved': return 'approved'
    case 'rejected': return 'returned'
    case 'issue_created': return 'logged an issue'
    case 'issue_fix_submitted': return 'submitted a fix on'
    case 'issue_verified': return 'verified fix on'
    case 'issue_reopened': return 'reopened issue'
    case 'published': return 'published'
    case 'on_hold': return 'placed on hold'
    case 'resumed': return 'resumed'
    case 'rescheduled': return 'rescheduled'
    case 'cancelled': return 'cancelled'
    case 'commented': return 'commented on'
    default: return 'updated'
  }
}
