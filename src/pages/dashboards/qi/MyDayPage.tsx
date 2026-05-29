import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, formatClockTime, isToday } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL, STATUS_TONE } from '../../../types/inspection'

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
    thisWeekSubmitted,
    thisWeekPublished,
    recentActivity,
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

    const last7 = Date.now() - 7 * 86400000
    const thisWeekSubmitted = myInspections.filter((i) => i.submittedAt && new Date(i.submittedAt).getTime() > last7).length
    const thisWeekPublished = myInspections.filter((i) => i.publishedAt && new Date(i.publishedAt).getTime() > last7).length

    const recentActivity = myInspections
      .flatMap((i) => i.timeline.map((e) => ({ event: e, inspection: i })))
      .sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime())
      .slice(0, 6)

    return { todays, inProgressNext, scheduledNext, nextInspection, returned, drafts, thisWeekSubmitted, thisWeekPublished, recentActivity }
  }, [myInspections])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Inspector'

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
          {nextInspection ? (
            <button
              onClick={() => nav.push(`${prefix}/inspections/${nextInspection.id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-[14px] font-medium hover:bg-accent-600 transition-colors"
            >
              Start your next inspection
              <Icon name="arrow_right" className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border hairline bg-transparent text-[14px] font-medium text-ink-400 dark:text-ink-600 cursor-not-allowed"
            >
              Nothing scheduled right now
            </button>
          )}
        </div>
      </div>

      {/* What's left for today */}
      <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden mb-8 shadow-sm">
        <div className="px-6 py-5 border-b hairline">
          <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
            What's left for today
          </div>
        </div>
        {todays.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border hairline border-dashed flex items-center justify-center">
              <Icon name="check" className="w-5 h-5 text-signal-green" />
            </div>
            <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">
              Nothing on your plate today.
            </div>
            <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
              Check back tomorrow or browse all your inspections.
            </p>
          </div>
        ) : (
          <div className="divide-y hairline">
            {todays.map(i => <TodayRow key={i.id} inspection={i} onClick={() => nav.push(`${prefix}/inspections/${i.id}`)} />)}
          </div>
        )}
      </div>

      {/* 3 smaller cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Returned to me */}
        <div className={`rounded-xl border hairline p-5 ${returned.length > 0 ? 'bg-signal-red/5' : 'bg-white dark:bg-ink-900'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Returned to me</h3>
            {returned.length > 0 && (
              <StatusPill tone="red">{returned.length}</StatusPill>
            )}
          </div>
          {returned.length === 0 ? (
            <p className="text-[13px] text-ink-500 dark:text-ink-400">Nothing returned.</p>
          ) : (
            <div className="space-y-4">
              {returned.slice(0, 3).map(i => {
                const rejectEvent = i.timeline.find(e => e.action === 'rejected')
                return (
                  <button key={i.id} onClick={() => nav.push(`${prefix}/inspections/${i.id}`)} className="block w-full text-left group">
                    <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">{i.number}</div>
                    <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5 truncate">{i.templateName}</div>
                    {rejectEvent?.note && (
                      <div className="mt-1.5 pl-2.5 border-l-2 border-signal-red/30 text-[12px] italic text-ink-600 dark:text-ink-300 line-clamp-2">
                        "{rejectEvent.note}"
                      </div>
                    )}
                  </button>
                )
              })}
              {returned.length > 3 && (
                <button onClick={() => nav.push(`${prefix}/returned`)} className="text-[12px] text-accent-600 dark:text-accent-400 font-medium">
                  +{returned.length - 3} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drafts */}
        <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Drafts</h3>
            {drafts.length > 0 && <span className="text-[12px] text-ink-500 dark:text-ink-400">{drafts.length} total</span>}
          </div>
          {drafts.length === 0 ? (
            <p className="text-[13px] text-ink-500 dark:text-ink-400">No drafts in progress.</p>
          ) : (
            <div className="space-y-4">
              {drafts.slice(0, 3).map(i => (
                <button key={i.id} onClick={() => nav.push(`${prefix}/inspections/${i.id}`)} className="block w-full text-left group">
                  <div className="font-mono text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-50 transition-colors">{i.number}</div>
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5 truncate">{i.templateName}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">Started {formatRelativeTime(i.startedAt || i.updatedAt)}</div>
                </button>
              ))}
              {drafts.length > 3 && (
                <button onClick={() => nav.push(`${prefix}/drafts`)} className="text-[12px] text-ink-600 dark:text-ink-300 font-medium hover:text-ink-900 dark:hover:text-ink-50">
                  +{drafts.length - 3} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* This week */}
        <div className="rounded-xl border hairline bg-white dark:bg-ink-900 p-5">
          <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-4">This week</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ink-600 dark:text-ink-300">Submitted</span>
              <span className="font-mono text-[14px] text-ink-900 dark:text-ink-50">{thisWeekSubmitted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ink-600 dark:text-ink-300">Published</span>
              <span className="font-mono text-[14px] text-signal-green">{thisWeekPublished}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h3 className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-4 px-2">Recent activity</h3>
        <div className="space-y-1 px-2">
          {recentActivity.length === 0 ? (
            <p className="text-[12px] text-ink-500 dark:text-ink-400 py-2">No recent activity.</p>
          ) : (
            recentActivity.map(({ event, inspection }) => (
              <button
                key={event.id}
                onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                className="w-full flex items-start gap-3 text-[12px] hover:bg-ink-50 dark:hover:bg-ink-800/60 -mx-2 px-2 py-1.5 rounded transition-colors text-left group"
              >
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotForAction(event.action)}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-ink-900 dark:text-ink-50 font-medium">{event.byName}</span>
                  <span className="text-ink-500 dark:text-ink-400"> {actionToText(event.action)} </span>
                  <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.number}</span>
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

function TodayRow({ inspection, onClick }: { inspection: Inspection; onClick: () => void }) {
  const time = formatClockTime(inspection.scheduledFor)
  
  let actionLabel = 'View'
  if (inspection.status === 'scheduled') actionLabel = 'Start'
  else if (inspection.status === 'in_progress') actionLabel = 'Continue'
  else if (inspection.status === 'rejected') actionLabel = 'Open returned'

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
    >
      <div className="sm:w-20 shrink-0">
        <div className="font-mono text-[16px] text-ink-900 dark:text-ink-50 tracking-tight">{time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink-900 dark:text-ink-50 truncate">
          {inspection.templateName}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-[13px] text-ink-500 dark:text-ink-400 truncate">
            {inspection.siteName} {inspection.area ? `· ${inspection.area}` : ''}
          </div>
          <StatusPill tone={STATUS_TONE[inspection.status]}>{STATUS_LABEL[inspection.status]}</StatusPill>
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
  if (action === 'issue_created' || action === 'rejected') return 'bg-signal-red'
  if (action === 'submitted' || action === 'issue_fix_submitted') return 'bg-signal-amber'
  if (action === 'published' || action === 'approved') return 'bg-signal-green'
  return 'bg-ink-300 dark:bg-ink-600'
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
