import { useMemo } from 'react'
import { useSession } from '../../../lib/session'
import { useNav } from '../../../lib/router'
import { useInspections, formatRelativeTime, formatClockTime, isToday } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { Avatar } from '../../../components/primitives/Avatar'
import { KpiStrip, type Kpi } from '../../../components/dashboard/KpiStrip'
import type { Inspection, InspectionDomain } from '../../../types/inspection'
import { STATUS_LABEL } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

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
    <div className="space-y-6">
      <PageBanner
        title={`Good ${greeting.toLowerCase() === 'good morning' ? 'morning' : greeting.toLowerCase() === 'good afternoon' ? 'afternoon' : 'evening'}, ${firstName}.`}
        subline={data.reviewQueue.length > 0
          ? `${data.reviewQueue.length} inspection${data.reviewQueue.length === 1 ? '' : 's'} waiting on your review · ${data.todays.length} scheduled today.`
          : `All caught up on reviews · ${data.todays.length} inspection${data.todays.length === 1 ? '' : 's'} scheduled today.`}
        actions={
          <>
            <button
              onClick={() => nav.push(`${prefix}/schedule`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition"
            >
              <Icon name="calendar" className="w-4 h-4" />
              Schedule
            </button>
            <button
              onClick={() => nav.push(`${prefix}/review`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[13px] font-bold transition shadow-sm"
            >
              + New inspection
            </button>
          </>
        }
      />

      {/* Needs attention card */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
            Needs your attention
          </div>
          <span className="inline-flex items-center gap-1 bg-warning/15 text-warning text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ring-warning/30">
            {attentionItems.length > 0 ? `${attentionItems.length} items` : 'all clear'}
          </span>
        </div>
        <div className="space-y-3">
          {attentionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
                <Icon name="check" className="w-5 h-5 text-status-pass" />
              </div>
              <p className="mt-2 text-[14px] font-semibold text-text-primary">Nothing waiting on you.</p>
              <p className="text-[12px] text-text-secondary mt-0.5">You'll see new submissions and corrective actions here.</p>
            </div>
          ) : (
            attentionItems.map((item, i) => (
              <div
                key={i}
                onClick={() => nav.push(item.href)}
                className="flex items-start justify-between p-3 rounded-xl border border-text-secondary/15 hover:bg-accent-light transition cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.tone === 'red' ? 'bg-status-fail' : 'bg-warning'}`} />
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary leading-snug">{item.title}</div>
                    <div className="text-[12px] text-text-secondary mt-0.5">{item.context}</div>
                  </div>
                </div>
                <Icon name="chevron_right" className="w-4 h-4 text-text-secondary mt-1" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip kpis={kpis} />

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Today's schedule */}
        <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
          <div className="px-6 py-5 border-b border-text-secondary/15 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                Today's schedule
              </div>
              <div className="mt-1 text-[18px] font-bold text-text-primary">
                {data.todays.length} inspection{data.todays.length === 1 ? '' : 's'} across {countSites(data.todays)} site{countSites(data.todays) === 1 ? '' : 's'}
              </div>
            </div>
            <button
              onClick={() => nav.push(`${prefix}/schedule`)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:text-primary transition-colors"
            >
              View full schedule
              <Icon name="arrow_right" className="w-3.5 h-3.5" />
            </button>
          </div>

          {data.todays.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-text-secondary">
              No inspections scheduled today.
            </div>
          ) : (
            <div className="divide-y divide-text-secondary/15">
              {data.todays.map((inspection) => (
                <ScheduleRow
                  key={inspection.id}
                  inspection={inspection}
                  onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="space-y-6">
          {/* Review Queue */}
          <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
            <div className="px-6 py-5 border-b border-text-secondary/15 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                  Review queue
                </div>
                <div className="mt-1 text-[16px] font-bold text-text-primary">
                  Newest submissions
                </div>
              </div>
            </div>
            {data.reviewQueue.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-text-secondary">
                Queue is empty.
              </div>
            ) : (
              <div className="divide-y divide-text-secondary/15">
                {data.reviewQueue.slice(0, 4).map((i) => (
                  <button
                    key={i.id}
                    onClick={() => nav.push(`${prefix}/inspections/${i.id}`)}
                    className="w-full px-6 py-4 flex items-start gap-3 hover:bg-accent-light transition text-left"
                  >
                    <Avatar name={i.inspectorName ?? '?'} size="w-7 h-7 text-[10px]" />
                    <div className="flex-grow min-w-0">
                      <div className="font-mono text-[11px] text-text-secondary">{i.number}</div>
                      <div className="text-[13px] font-semibold text-text-primary truncate">
                        {shortTemplateName(i.templateName)}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {i.inspectorName} · {formatRelativeTime(i.submittedAt)}
                      </div>
                    </div>
                    <Icon name="chevron_right" className="w-4 h-4 text-text-secondary mt-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Team activity */}
          <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-4">
              Team activity
            </div>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-[12px] text-text-secondary text-center py-2">
                  No recent activity.
                </p>
              ) : (
                data.recentActivity.map(({ event, inspection }) => (
                  <div
                    key={event.id}
                    onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
                    className="flex items-start justify-between p-3 rounded-xl border border-text-secondary/15 hover:bg-accent-light transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotForAction(event.action)}`} />
                      <div>
                        <div className="text-[14px] font-semibold text-text-primary leading-tight">
                          {event.byName} <span className="text-[13px] font-normal text-text-secondary">{actionToText(event.action)}</span> {inspection.number}
                        </div>
                        {event.note && (
                          <div className="mt-0.5 text-[12px] text-text-secondary italic">"{event.note}"</div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-text-secondary shrink-0">
                      {formatRelativeTime(event.at)}
                    </span>
                  </div>
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
    <button
      onClick={onClick}
      className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 text-left hover:bg-accent-light transition group"
    >
      <div className="sm:w-24 shrink-0">
        <div className={`text-[13px] font-bold ${isNow ? 'text-primary' : 'text-text-primary'}`}>
          {formatClockTime(inspection.scheduledFor)}
        </div>
        <div className="text-[11px] text-text-secondary mt-0.5">{STATUS_LABEL[inspection.status]}</div>
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-[14px] font-semibold text-text-primary truncate">
          {inspection.templateName}
        </div>
        <div className="text-[12px] text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span>{inspection.inspectorName ?? 'Unassigned'}</span>
          <span className="opacity-50">·</span>
          <span>{inspection.area ?? inspection.siteName}</span>
        </div>
      </div>
      <Icon name="chevron_right" className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition-transform" />
    </button>
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
