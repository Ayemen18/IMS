import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, formatClockTime, isToday } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

function filterToMyInspections(
  inspections: Inspection[],
  user: { name: string; email: string } | null
): Inspection[] {
  if (!user) return []
  return inspections.filter(
    (i) => (i.inspectorName === user.name || i.inspectorId === user.email)
  )
}

function greetByHour() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function MyDayPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const { user } = useSession()
  const nav = useNav()
  const prefix = domain === 'safety' ? '/si' : '/qi'
  const { inspections } = useInspections()

  const myInspections = useMemo(() => filterToMyInspections(inspections.filter(i => i.domain === domain), user), [inspections, user, domain])

  const {
    todays,
    inProgressNext,
    scheduledNext,
    nextInspection,
    returned,
    drafts,
    recentActivity,
    upcomingScheduled,
  } = useMemo(() => {
    const todays = myInspections
      .filter((i) => isToday(i.scheduledFor) || isToday(i.startedAt || ''))
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
      
    const inProgressNext = myInspections.find((i) => i.status === 'in_progress')
    const scheduledNext = myInspections
      .filter((i) => i.status === 'scheduled' && new Date(i.scheduledFor).getTime() > Date.now())
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0]

    const nextInspection = inProgressNext || scheduledNext

    const returned = myInspections
      .filter((i) => i.status === 'rejected')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      
    const drafts = myInspections
      .filter((i) => i.status === 'in_progress')
      .sort((a, b) => new Date(b.startedAt || b.updatedAt).getTime() - new Date(a.startedAt || a.updatedAt).getTime())



    const upcomingScheduled = myInspections
      .filter((i) => i.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())

    const recentActivity = myInspections
      .flatMap((i) => i.timeline.map((e) => ({ event: e, inspection: i })))
      .sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime())
      .slice(0, 6)

    return { todays, inProgressNext, scheduledNext, nextInspection, returned, drafts, recentActivity, upcomingScheduled }
  }, [myInspections])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Inspector'
  const timeOfDay = greetByHour()

  const subheading = useMemo(() => {
    if (returned.length > 0) {
      const rejectEvent = returned[0].timeline.find(e => e.action === 'rejected')
      const managerName = rejectEvent?.byName?.split(/\s+/)[0] ?? 'Your manager'
      return `${returned.length} returned for rework · ${managerName} left feedback.`
    }
    if (inProgressNext) {
      return `${todays.length} inspection${todays.length === 1 ? '' : 's'} scheduled today · 1 in progress.`
    }
    if (scheduledNext) {
      return `${todays.length} inspection${todays.length === 1 ? '' : 's'} scheduled today · next starts ${formatRelativeTime(scheduledNext.scheduledFor)}.`
    }
    const doneToday = todays.filter(i => ['submitted', 'under_review', 'approved', 'published', 'issues_open', 'issues_closed'].includes(i.status)).length
    if (todays.length > 0 && doneToday === todays.length) {
      return `${doneToday} done today · great work.`
    }
    return `Nothing on your plate today.`
  }, [returned, inProgressNext, scheduledNext, todays])

  return (
    <div className="space-y-6">
      <PageBanner
        title={`Good ${timeOfDay}, ${firstName}.`}
        subline={subheading}
        actions={
          nextInspection ? (
            <button
              onClick={() => nav.push(`${prefix}/inspections/${nextInspection.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              Start next inspection
              <Icon name="arrow_right" className="w-4 h-4 ml-1" />
            </button>
          ) : null
        }
      />

      {/* Big "what's left today" card */}
      <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-6 lg:p-7 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
        <div className="pl-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
            What's left today
          </div>
          <div className="font-mono text-[40px] font-bold text-text-primary leading-none mb-1">
            {todays.filter(i => !['submitted', 'approved', 'published'].includes(i.status)).length}
          </div>
          <div className="text-[13px] text-text-secondary mb-5">
            inspections waiting
          </div>

          {todays.length === 0 ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-2 shadow-soft">
                <Icon name="check" className="w-5 h-5 text-status-pass" />
              </div>
              <div className="text-[14px] font-semibold text-text-primary">
                You're all done for today.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {todays.map((i) => (
                <button
                  key={i.id}
                  onClick={() => nav.push(`${prefix}/inspections/${i.id}`)}
                  className="w-full bg-white hover:bg-accent-light p-4 rounded-xl border border-text-secondary/15 flex items-center justify-between text-left transition shadow-soft"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary truncate">
                      {i.templateName}
                    </div>
                    <div className="text-[12px] text-text-secondary mt-0.5 truncate">
                      {i.siteName} · {formatClockTime(i.scheduledFor)}
                    </div>
                  </div>
                  <StatusPill tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</StatusPill>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Three smaller cards in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SupportingCard
          label="Returned to me"
          count={returned.length}
          tone="amber"
          items={returned.slice(0, 2).map((i) => ({ id: i.id, title: i.templateName }))}
          onClick={() => nav.push(`${prefix}/returned`)}
        />
        <SupportingCard
          label="Drafts"
          count={drafts.length}
          tone="neutral"
          items={drafts.slice(0, 2).map((i) => ({ id: i.id, title: i.templateName }))}
          onClick={() => nav.push(`${prefix}/drafts`)}
        />
        <SupportingCard
          label="This week"
          count={upcomingScheduled.length}
          tone="green"
          items={upcomingScheduled.slice(0, 2).map((i) => ({ id: i.id, title: i.templateName }))}
          onClick={() => nav.push(`${prefix}/schedule`)}
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
            recentActivity.map(({ event, inspection }) => (
              <div
                key={event.id}
                onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                className="flex items-start justify-between p-3 rounded-xl border border-text-secondary/15 hover:bg-accent-light transition cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotForAction(event.action)}`} />
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary">
                      {event.byName} <span className="text-[13px] font-normal text-text-secondary">{actionToText(event.action)}</span> {inspection.number}
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
  if (action === 'issue_created' || action === 'rejected') return 'bg-status-fail'
  if (action === 'submitted' || action === 'issue_fix_submitted') return 'bg-warning'
  if (action === 'published' || action === 'approved') return 'bg-status-pass'
  return 'bg-accent-light'
}

function actionToText(action: string) {
  switch (action) {
    case 'scheduled': return 'scheduled'
    case 'started': return 'started'
    case 'submitted': return 'submitted draft for'
    case 'approved': return 'approved'
    case 'rejected': return 'returned'
    case 'issue_created': return 'logged an issue on'
    case 'issue_fix_submitted': return 'submitted a fix on'
    case 'issue_verified': return 'verified fix on'
    case 'issue_reopened': return 'reopened issue on'
    case 'published': return 'published'
    case 'on_hold': return 'placed on hold'
    case 'resumed': return 'resumed'
    case 'rescheduled': return 'rescheduled'
    case 'cancelled': return 'cancelled'
    case 'commented': return 'commented on'
    default: return 'updated'
  }
}
