import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, flattenIssues } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { PageBanner } from '../../../components/shell/PageBanner'


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
    const myAreas = new Set(assignedToMe.map((f: any) => f.inspection.area).filter(Boolean))
    const inAreaIssues = allIssues
      .filter((f: any) => f.inspection.area && myAreas.has(f.inspection.area) && new Date(f.issue.createdAt).getTime() > last7)
      .sort((a: any, b: any) => new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime())

    // 3. Recent Activity
    const relevantInspectionIds = new Set(assignedToMe.map((f: any) => f.inspection.id))
    const recentActivity = inspections
      .filter((i: any) => relevantInspectionIds.has(i.id))
      .flatMap((i: any) => i.timeline.map((e: any) => ({ event: e, inspection: i })))
      .sort((a: any, b: any) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime())
      .slice(0, 6)

    return { myIssues, inProgressNext, awaitingReview, recentlyClosed, inAreaIssues, recentActivity }
  }, [inspections, user])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Employee'
  const timeOfDay = greetByHour()

  const subheading = useMemo(() => {
    const activeCount = myIssues.filter((f: any) => f.issue.state === 'in_progress' || f.issue.state === 'reopened').length
    const reviewCount = awaitingReview.length

    if (activeCount > 0 && reviewCount > 0) {
      return `${activeCount} corrective action${activeCount === 1 ? '' : 's'} assigned to you · ${reviewCount} awaiting verification.`
    }
    if (activeCount > 0) {
      return `${activeCount} corrective action${activeCount === 1 ? '' : 's'} assigned to you.`
    }
    if (reviewCount > 0) {
      return `${reviewCount} corrective action${reviewCount === 1 ? '' : 's'} awaiting verification.`
    }
    return `No corrective actions assigned right now.`
  }, [myIssues, awaitingReview])

  const remainingActions = myIssues.filter((f: any) => f.issue.state === 'in_progress' || f.issue.state === 'reopened')

  return (
    <div className="space-y-6">
      <PageBanner
        title={`Good ${timeOfDay}, ${firstName}.`}
        subline={subheading}
        actions={
          inProgressNext ? (
            <button
              onClick={() => nav.push(`/emp/issues/${inProgressNext.issue.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              Open next action
              <Icon name="arrow_right" className="w-4 h-4 ml-1" />
            </button>
          ) : null
        }
      />

      {/* Big "corrective actions waiting" card */}
      <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-6 lg:p-7 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
        <div className="pl-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
            Your active actions
          </div>
          <div className="font-mono text-[40px] font-bold text-text-primary leading-none mb-1">
            {remainingActions.length}
          </div>
          <div className="text-[13px] text-text-secondary mb-5">
            corrective actions pending
          </div>

          {remainingActions.length === 0 ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-2 shadow-soft">
                <Icon name="check" className="w-5 h-5 text-status-pass" />
              </div>
              <div className="text-[14px] font-semibold text-text-primary">
                You're all clear.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {remainingActions.map((f: any) => (
                <button
                  key={f.issue.id}
                  onClick={() => nav.push(`/emp/issues/${f.issue.id}`)}
                  className="w-full bg-white hover:bg-accent-light p-4 rounded-xl border border-text-secondary/15 flex items-center justify-between text-left transition shadow-soft"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary truncate">
                      {f.issue.itemPrompt}
                    </div>
                    <div className="text-[12px] text-text-secondary mt-0.5 truncate">
                      {f.inspection.number} · {f.inspection.templateName}
                    </div>
                  </div>
                  <IssueStatePill state={f.issue.state} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Three smaller cards in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SupportingCard
          label="Awaiting manager"
          count={awaitingReview.length}
          tone="amber"
          items={awaitingReview.slice(0, 2).map((f: any) => ({ id: f.issue.id, title: f.issue.itemPrompt }))}
          onClick={() => nav.push(`/emp/under_review`)}
        />
        <SupportingCard
          label="Recently closed"
          count={recentlyClosed.length}
          tone="green"
          items={recentlyClosed.slice(0, 2).map((f: any) => ({ id: f.issue.id, title: f.issue.itemPrompt }))}
          onClick={() => nav.push(`/emp/closed`)}
        />
        <SupportingCard
          label="In your area"
          count={inAreaIssues.length}
          tone="neutral"
          items={inAreaIssues.slice(0, 2).map((f: any) => ({ id: f.issue.id, title: f.issue.itemPrompt }))}
          onClick={() => nav.push(`/emp/in_area`)}
        />
      </div>

      {/* Recent activity feed */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-4">
          Recent activity
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No recent activity.</p>
          ) : (
            recentActivity.map(({ event, inspection }: any) => (
              <div
                key={event.id}
                onClick={() => nav.push(event.target ? `/emp/issues/${event.target}` : `/emp`)}
                className="flex items-start justify-between p-3 rounded-xl border border-text-secondary/15 hover:bg-accent-light transition cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotForAction(event.action)}`} />
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary">
                      {event.byName} <span className="text-[13px] font-normal text-text-secondary">{actionToText(event.action)}</span> {event.target || inspection.number}
                    </div>
                    {event.note && (
                      <p className="text-[12px] italic text-text-secondary mt-0.5">
                        "{event.note}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-text-secondary">
                  {formatRelativeTime(event.at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SupportingCard({
  label,
  count,
  tone,
  items,
  onClick,
}: {
  label: string
  count: number
  tone: 'amber' | 'neutral' | 'green'
  items: { id: string; title: string }[]
  onClick?: () => void
}) {
  const leftAccentMap = {
    amber:   'bg-warning',
    neutral: 'bg-primary',
    green:   'bg-status-pass',
  }
  
  return (
    <div onClick={onClick} className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-5 flex flex-col justify-between h-full hover:shadow-lift transition-shadow cursor-pointer overflow-hidden">
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftAccentMap[tone]}`} aria-hidden="true" />
      
      <div className="pl-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
            {label}
          </div>
          <div className="font-mono text-[28px] font-bold text-text-primary leading-none mb-3">
            {count}
          </div>
        </div>
        <div className="space-y-1.5 mt-2">
          {items.map((item) => (
            <div key={item.id} className="text-[12px] text-text-secondary truncate font-semibold">
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function dotForAction(action: string) {
  if (action === 'issue_created' || action === 'rejected' || action === 'issue_reopened') return 'bg-status-fail'
  if (action === 'submitted' || action === 'issue_fix_submitted') return 'bg-warning'
  if (action === 'published' || action === 'approved' || action === 'issue_verified') return 'bg-status-pass'
  return 'bg-accent-light'
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
