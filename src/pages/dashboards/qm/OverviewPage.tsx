import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, formatClockTime, isToday } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import { Avatar } from '../../../components/primitives/Avatar'
import { KpiStrip, type Kpi } from '../../../components/dashboard/KpiStrip'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL } from '../../../types/inspection'

export function QualityManagerOverviewPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const { user } = useSession()
  const { inspections: allInspections } = useInspections()
  const inspections = useMemo(() => allInspections.filter(i => i.domain === domain), [allInspections, domain])
  const nav = useNav()
  const prefix = domain === 'safety' ? '/sm' : '/qm'

  /* ============ Derive everything we need from inspections ============ */

  const data = useMemo(() => {
    const reviewQueue = inspections
      .filter((i) => i.status === 'under_review' || i.status === 'submitted')
      .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime())

    const verifyQueue = inspections.filter((i) =>
      i.issues.some((iss) => iss.state === 'awaiting_verification')
    )

    const inProgress = inspections.filter((i) => i.status === 'in_progress')
    const onHold     = inspections.filter((i) => i.status === 'on_hold')
    const rejected   = inspections.filter((i) => i.status === 'rejected')

    const todays = inspections
      .filter((i) => isToday(i.scheduledFor))
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())

    const completedToday = inspections.filter(
      (i) => i.publishedAt && isToday(i.publishedAt)
    )

    // All open issues across all inspections
    const openIssues = inspections.flatMap((i) =>
      i.issues
        .filter((iss) => iss.state === 'open' || iss.state === 'in_progress')
        .map((iss) => ({ inspection: i, issue: iss }))
    )

    // Recent activity — flatten timelines, newest first
    const recentActivity = inspections
      .flatMap((i) =>
        i.timeline.map((e) => ({ event: e, inspection: i }))
      )
      .sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime())
      .slice(0, 8)

    return {
      reviewQueue,
      verifyQueue,
      inProgress,
      onHold,
      rejected,
      todays,
      completedToday,
      openIssues,
      recentActivity,
    }
  }, [inspections])

  const greeting = greetByHour()
  const firstName = user?.name?.split(/\s+/)[0] ?? 'Rahul'

  // Build a focused "needs your attention" list — top 3 items by urgency
  const attentionItems = useMemo(() => {
    const items: AttentionItem[] = []

    // Rejected drafts to communicate (urgent — inspector is stuck)
    data.rejected.slice(0, 1).forEach((i) =>
      items.push({
        tone: 'red',
        title: `Draft you rejected is awaiting rework by ${i.inspectorName}`,
        context: `${i.number} · ${i.area ?? i.siteName}`,
        href: `/qm/inspections/${i.id}`,
      })
    )

    // Awaiting verification — manager has to verify the fix
    data.verifyQueue.slice(0, 2).forEach((i) => {
      const issue = i.issues.find((iss) => iss.state === 'awaiting_verification')
      items.push({
        tone: 'amber',
        title: `${issue?.assigneeName ?? 'A teammate'} submitted a corrective action for your review`,
        context: `${i.number} · ${issue?.itemPrompt ?? 'Issue'}`,
        href: `/qm/inspections/${i.id}`,
      })
    })

    // Top of the review queue
    data.reviewQueue.slice(0, Math.max(0, 3 - items.length)).forEach((i) =>
      items.push({
        tone: 'amber',
        title: `${i.inspectorName} submitted ${i.templateName.split('—')[0].trim()} for review`,
        context: `${i.number} · submitted ${formatRelativeTime(i.submittedAt)}`,
        href: `/qm/inspections/${i.id}`,
      })
    )

    return items.slice(0, 3)
  }, [data])

  /* ============ KPIs ============ */
  const kpis: Kpi[] = [
    {
      label: 'Awaiting review',
      value: String(data.reviewQueue.length),
      delta: data.reviewQueue.length > 0 ? 'needs you' : 'all clear',
      deltaTone: data.reviewQueue.length > 0 ? 'amber' : 'green',
      progress: Math.min(100, data.reviewQueue.length * 18),
      progressTone: data.reviewQueue.length > 0 ? 'amber' : 'green',
    },
    {
      label: 'Open issues',
      value: String(data.openIssues.length),
      delta: data.openIssues.length > 0 ? 'tracking' : 'none',
      deltaTone: data.openIssues.length > 3 ? 'red' : 'amber',
      progress: Math.min(100, data.openIssues.length * 12),
      progressTone: data.openIssues.length > 3 ? 'red' : 'amber',
    },
    {
      label: 'In progress now',
      value: String(data.inProgress.length),
      delta: 'live',
      deltaTone: 'green',
      progress: Math.min(100, data.inProgress.length * 25),
      progressTone: 'green',
    },
    {
      label: 'Published today',
      value: String(data.completedToday.length),
      delta: '+ today',
      deltaTone: 'green',
      progress: Math.min(100, data.completedToday.length * 30),
      progressTone: 'green',
    },
  ]

  return (
    <div className="stagger">
      {/* ============ Hero header + attention card ============ */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>{domain === 'safety' ? 'Safety Manager' : 'Quality Manager'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Overview</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            {greeting}, <span className="italic text-ink-500 dark:text-ink-400">{firstName}</span>.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            {data.reviewQueue.length > 0
              ? `${data.reviewQueue.length} inspection${data.reviewQueue.length === 1 ? '' : 's'} waiting on your review · ${data.todays.length} scheduled today.`
              : `All caught up on reviews · ${data.todays.length} inspection${data.todays.length === 1 ? '' : 's'} scheduled today.`}
          </p>

          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => nav.push(`${prefix}/review`)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors"
            >
              <Icon name="eye" className="w-3.5 h-3.5" />
              Open review queue
            </button>
            <button
              onClick={() => nav.push(`${prefix}/schedule`)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              <Icon name="calendar" className="w-3.5 h-3.5" />
              Schedule
            </button>
            <button
              onClick={() => nav.push(`${prefix}/inspections`)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              <Icon name="check" className="w-3.5 h-3.5" />
              All inspections
            </button>
          </div>
        </div>

        {/* Attention card */}
        <div className="col-span-12 lg:col-span-5">
          <div className="h-full rounded-xl border hairline bg-white dark:bg-ink-900 p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
                Needs your attention
              </div>
              <StatusPill tone={attentionItems.length > 0 ? 'amber' : 'green'}>
                {attentionItems.length > 0
                  ? `${attentionItems.length} item${attentionItems.length === 1 ? '' : 's'}`
                  : 'all clear'}
              </StatusPill>
            </div>
            <div className="mt-4 space-y-2.5 flex-1">
              {attentionItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <div className="w-10 h-10 rounded-full border hairline border-dashed flex items-center justify-center">
                    <Icon name="check" className="w-4 h-4 text-signal-green" />
                  </div>
                  <p className="mt-3 text-[13px] text-ink-700 dark:text-ink-200">Nothing waiting on you.</p>
                  <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">You'll see new submissions and corrective actions here.</p>
                </div>
              ) : (
                attentionItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => nav.push(item.href)}
                    className="w-full group flex items-start gap-3 cursor-pointer p-2 -mx-2 rounded-md hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors text-left"
                  >
                    <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${item.tone === 'red' ? 'bg-signal-red' : 'bg-signal-amber'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink-900 dark:text-ink-50 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">{item.context}</div>
                    </div>
                    <Icon
                      name="chevron_right"
                      className="w-3.5 h-3.5 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ KPI strip ============ */}
      <div className="mt-8">
        <KpiStrip kpis={kpis} />
      </div>

      {/* ============ Two-column lower content ============ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Today's schedule */}
        <div className="lg:col-span-2 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
          <div className="px-5 py-4 border-b hairline flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Today's schedule</div>
              <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5">
                {data.todays.length} inspection{data.todays.length === 1 ? '' : 's'} across {countSites(data.todays)} site{countSites(data.todays) === 1 ? '' : 's'}
              </div>
            </div>
            <button
              onClick={() => nav.push(`${prefix}/schedule`)}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
            >
              View full schedule
              <Icon name="arrow_right" className="w-3 h-3" />
            </button>
          </div>

          {data.todays.length === 0 ? (
            <div className="px-5 py-12 text-center text-[13px] text-ink-500 dark:text-ink-400">
              No inspections scheduled today.
            </div>
          ) : (
            <ol className="relative divide-y hairline">
              {data.todays.map((inspection) => (
                <ScheduleRow
                  key={inspection.id}
                  inspection={inspection}
                  onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                />
              ))}
            </ol>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Review queue summary */}
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Review queue</div>
                  <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5">Newest first</div>
                </div>
                <button
                  onClick={() => nav.push(`${prefix}/review`)}
                  className="text-[11px] font-mono text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
                >
                  open
                </button>
              </div>
            </div>
            {data.reviewQueue.length === 0 ? (
              <div className="px-5 py-8 text-center text-[12px] text-ink-500 dark:text-ink-400">
                Queue is empty.
              </div>
            ) : (
              <div className="divide-y hairline">
                {data.reviewQueue.slice(0, 4).map((i) => (
                  <button
                    key={i.id}
                    onClick={() => nav.push(`${prefix}/inspections/${i.id}`)}
                    className="w-full px-5 py-3 flex items-start gap-3 hover:bg-ink-50 dark:bg-ink-800/60 transition-colors group text-left"
                  >
                    <Avatar name={i.inspectorName ?? '?'} size="w-7 h-7 text-[10px]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-ink-400 dark:text-ink-500">{i.number}</div>
                      <div className="text-[13px] text-ink-900 dark:text-ink-50 truncate">
                        {shortTemplateName(i.templateName)}
                      </div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">
                        {i.inspectorName} · {formatRelativeTime(i.submittedAt)}
                      </div>
                    </div>
                    <Icon
                      name="chevron_right"
                      className="w-3.5 h-3.5 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Team activity */}
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Team activity</div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-[12px] text-ink-500 dark:text-ink-400 text-center py-2">
                  No recent activity.
                </p>
              ) : (
                data.recentActivity.map(({ event, inspection }) => (
                  <button
                    key={event.id}
                    onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                    className="w-full flex items-start gap-3 text-[12px] hover:bg-ink-50 dark:hover:bg-ink-800/60 -mx-2 px-2 py-1 rounded transition-colors text-left group"
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
      </div>
    </div>
  )
}

/* ============================================================
 * Sub-components and helpers
 * ============================================================ */

interface AttentionItem {
  tone: 'red' | 'amber' | 'green'
  title: string
  context: string
  href: string
}

function ScheduleRow({ inspection, onClick }: { inspection: Inspection; onClick: () => void }) {
  const isNow = inspection.status === 'in_progress'
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4 text-left hover:bg-ink-50 dark:bg-ink-900 dark:hover:bg-ink-800/60 transition-colors group"
      >
        <div className="sm:w-24 shrink-0">
          <div className={`text-[13px] font-medium ${isNow ? 'text-accent-600 dark:text-accent-400' : 'text-ink-900 dark:text-ink-50'}`}>
            {formatClockTime(inspection.scheduledFor)}
          </div>
          <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">{STATUS_LABEL[inspection.status]}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">
              {inspection.templateName}
            </span>
          </div>
          <div className="text-[12px] text-ink-500 dark:text-ink-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{inspection.inspectorName ?? 'Unassigned'}</span>
            <span className="opacity-50">·</span>
            <span>{inspection.area ?? inspection.siteName}</span>
          </div>
        </div>
        <Icon name="chevron_right" className="w-4 h-4 text-ink-300 dark:text-ink-600 group-hover:text-ink-900 dark:group-hover:text-ink-50 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
      </button>
    </li>
  )
}

function greetByHour() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function countSites(inspections: Inspection[]) {
  return new Set(inspections.map(i => i.siteId)).size
}

function shortTemplateName(name: string) {
  return name.split('—')[0].trim()
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
    case 'rejected': return 'rejected'
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
