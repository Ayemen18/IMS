import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../lib/router'
import {
  useTemplates,
  INSPECTION_TYPES,
  formatDate,
  formatRelativeTime,
  statusToneFor,
  statusLabelFor,
  diffTemplates,
} from '../../lib/templates'
import { Icon } from '../../components/primitives/Icon'
import { StatusPill } from '../../components/primitives/StatusPill'
import { Avatar } from '../../components/primitives/Avatar'
import type {
  Template,
  TemplateStatus,
  TemplateVersionChange,
} from '../../types/template'

type TimelineEvent = TemplateVersionChange & {
  templateId: string
  templateVersion: string
  templateStatus: TemplateStatus
}

export function TemplateHistoryPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const { getById, getLineage } = useTemplates()
  const nav = useNav()

  const template = templateId ? getById(templateId) : undefined

  // The lineage is sorted newest-first by createdAt — perfect for the versions list
  const lineage = useMemo<Template[]>(
    () => (template ? getLineage(template.baseTemplateId) : []),
    [template, getLineage]
  )

  // Flatten every version's changelog into a single chronological activity stream
  const activityTimeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = []
    lineage.forEach((t) => {
      t.changelog.forEach((c) => {
        events.push({
          ...c,
          templateId: t.id,
          templateVersion: t.version,
          templateStatus: t.status,
        })
      })
    })
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [lineage])

  if (!template) {
    return (
      <div className="stagger">
        <Breadcrumb onBack={() => nav.push('/admin/templates')} />
        <div className="mt-10 rounded-xl border hairline border-dashed p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline">
            <Icon name="alert" className="w-5 h-5 text-ink-400 dark:text-ink-500" />
          </div>
          <h2 className="mt-4 font-display text-[28px] tracking-tight text-ink-900 dark:text-ink-50">
            Template not found
          </h2>
          <button
            onClick={() => nav.push('/admin/templates')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium hover:bg-accent-600 transition-colors"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
            Back to templates
          </button>
        </div>
      </div>
    )
  }

  const type = INSPECTION_TYPES[template.inspectionType]
  const publishedCount = lineage.filter((t) => t.status === 'published').length
  const draftCount     = lineage.filter((t) => t.status === 'draft').length
  const supersededCount = lineage.filter((t) => t.status === 'superseded').length

  return (
    <div className="stagger">
      {/* ============ Breadcrumb ============ */}
      <Breadcrumb
        onBack={() => nav.push(`/admin/templates/${template.id}`)}
        templateName={template.name}
      />

      {/* ============ Hero header ============ */}
      <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
        <div className="min-w-0 max-w-[640px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border hairline">
              <span className={`w-1.5 h-1.5 rounded-sm ${type.accent}`} />
              {type.label}
            </span>
            <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">
              {lineage.length} version{lineage.length === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            History · <span className="italic text-ink-500 dark:text-ink-400">{template.name}</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-600 dark:text-ink-300">
            Every revision in this template's lineage and every change recorded against them.
            Each version's content remains immutable after it's been superseded or archived.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => nav.push(`/admin/templates/${template.id}`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5 rotate-180" />
            Back to template
          </button>
        </div>
      </div>

      {/* ============ Stat row ============ */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
        <Stat label="Versions"   value={String(lineage.length)} />
        <Stat label="Published"  value={String(publishedCount)} />
        <Stat label="Drafts"     value={String(draftCount)} />
        <Stat label="Superseded" value={String(supersededCount)} />
      </div>

      {/* ============ Versions list ============ */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-[24px] tracking-tight text-ink-900 dark:text-ink-50">
            Versions
          </h2>
          <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
            newest first
          </span>
        </div>

        <ol className="relative space-y-3">
          {/* The continuous left rail */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-ink-200 dark:bg-ink-800 pointer-events-none" />

          {lineage.map((version, idx) => {
            const isViewing = version.id === template.id
            // Diff against the previous version in the lineage (newer-first array, so prev = next index)
            const previousVersion = lineage[idx + 1]
            const diff = previousVersion ? diffTemplates(previousVersion, version) : null
            // Find the publish entry on this version, if any
            const publishEntry = version.changelog.find((c) => c.action === 'published')

            return (
              <VersionCard
                key={version.id}
                version={version}
                isViewing={isViewing}
                diffSummary={diff?.summary}
                publishEntry={publishEntry}
                onView={() => nav.push(`/admin/templates/${version.id}`)}
              />
            )
          })}
        </ol>
      </div>

      {/* ============ Activity timeline ============ */}
      <div className="mt-12">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-[24px] tracking-tight text-ink-900 dark:text-ink-50">
            Activity
          </h2>
          <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
            {activityTimeline.length} event{activityTimeline.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
          <ul className="divide-y hairline">
            {activityTimeline.map((event) => (
              <ActivityRow
                key={event.id}
                event={event}
                onViewVersion={() => nav.push(`/admin/templates/${event.templateId}`)}
                isCurrentVersion={event.templateId === template.id}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-12" />
    </div>
  )
}

/* ============================================================
 * Version card — the dominant unit on this page
 * ============================================================ */

function VersionCard({
  version,
  isViewing,
  diffSummary,
  publishEntry,
  onView,
}: {
  version: Template
  isViewing: boolean
  diffSummary?: string
  publishEntry?: TemplateVersionChange
  onView: () => void
}) {
  const tone = statusToneFor(version.status)
  const label = statusLabelFor(version.status)

  return (
    <li className="relative pl-12">
      {/* Status dot anchored on the left rail */}
      <div className="absolute left-[12px] top-5 z-10">
        <div className={`w-[15px] h-[15px] rounded-full ring-4 ring-white dark:ring-ink-950 ${
          version.status === 'published'  ? 'bg-signal-green' :
          version.status === 'draft'      ? 'bg-signal-amber' :
          version.status === 'superseded' ? 'bg-ink-400 dark:bg-ink-500' :
          /* archived */                    'bg-ink-300 dark:bg-ink-600'
        }`} />
      </div>

      <div
        className={`rounded-xl border bg-white dark:bg-ink-900 transition-all ${
          isViewing
            ? 'border-ink-400 dark:border-ink-500 shadow-sm'
            : 'border-black/[0.06] dark:border-white/[0.08] hover:border-ink-300 dark:hover:border-ink-600'
        }`}
      >
        {/* Header row */}
        <div className="px-5 py-3.5 flex items-center justify-between gap-4 border-b hairline">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display text-[22px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
              v{version.version}
            </span>
            <StatusPill tone={tone}>{label}</StatusPill>
            {isViewing && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500 dark:text-ink-400 px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
                viewing
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
              {formatDate(version.createdAt)}
            </span>
            {!isViewing && (
              <button
                onClick={onView}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                View
                <Icon name="arrow_right" className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Diff summary */}
          {diffSummary && (
            <div className="text-[12px] text-ink-700 dark:text-ink-200">
              <span className="font-mono text-ink-400 dark:text-ink-500 mr-1.5">Δ</span>
              {diffSummary}
            </div>
          )}

          {/* Publish note */}
          {publishEntry?.note && (
            <div className="rounded-md bg-ink-50/70 dark:bg-ink-950/40 border hairline px-3 py-2.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-1">
                Publish note
              </div>
              <p className="text-[12px] text-ink-700 dark:text-ink-200 leading-relaxed">
                {publishEntry.note}
              </p>
            </div>
          )}

          {/* Footer row: ownership + metadata */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={version.ownerName} size="w-6 h-6 text-[10px]" />
              <span className="text-[12px] text-ink-700 dark:text-ink-200 truncate">
                {version.ownerName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-ink-500 dark:text-ink-400 shrink-0">
              <span title="Sections">
                <span className="text-ink-400 dark:text-ink-500">sections</span> {version.sections.length}
              </span>
              <span title="Items">
                <span className="text-ink-400 dark:text-ink-500">items</span> {version.itemCount}
              </span>
              <span className="font-mono text-ink-400 dark:text-ink-500 truncate max-w-[140px]">
                {version.id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

/* ============================================================
 * Activity row — the audit trail
 * ============================================================ */

function ActivityRow({
  event,
  onViewVersion,
  isCurrentVersion,
}: {
  event: TimelineEvent
  onViewVersion: () => void
  isCurrentVersion: boolean
}) {
  const actionVisual = ACTION_VISUAL[event.action]

  return (
    <li className="px-5 py-3.5 flex items-start gap-4 hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-colors">
      {/* Action icon */}
      <div className={`mt-0.5 w-7 h-7 rounded-md border hairline flex items-center justify-center shrink-0 ${actionVisual.bg}`}>
        <Icon name={actionVisual.icon} className={`w-3.5 h-3.5 ${actionVisual.fg}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-ink-900 dark:text-ink-50">
          <span className="font-medium">{event.byName}</span>{' '}
          <span className="text-ink-500 dark:text-ink-400">{verbFor(event.action)}</span>{' '}
          <button
            onClick={onViewVersion}
            className="font-mono text-ink-700 dark:text-ink-200 hover:text-ink-900 dark:hover:text-ink-50 underline underline-offset-2 transition-colors"
          >
            v{event.templateVersion}
          </button>
          {isCurrentVersion && (
            <span className="ml-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-500 dark:text-ink-400 px-1 py-0.5 rounded bg-ink-100 dark:bg-ink-800">
              current
            </span>
          )}
        </div>
        {event.note && (
          <p className="mt-0.5 text-[12px] text-ink-600 dark:text-ink-300 leading-relaxed">
            {event.note}
          </p>
        )}
      </div>

      {/* Right metadata */}
      <div className="text-right shrink-0 space-y-0.5">
        <div className="text-[11px] font-mono text-ink-600 dark:text-ink-300">
          {formatRelativeTime(event.at)}
        </div>
        <div className="text-[10px] font-mono text-ink-400 dark:text-ink-500">
          {formatDate(event.at)}
        </div>
      </div>
    </li>
  )
}

/* ============================================================
 * Action visual map — color tone per action type
 * ============================================================ */

const ACTION_VISUAL: Record<
  TemplateVersionChange['action'],
  { icon: 'plus' | 'check' | 'settings' | 'box' | 'layers' | 'close'; fg: string; bg: string }
> = {
  created:    { icon: 'plus',     fg: 'text-signal-green',           bg: 'bg-signal-green/10' },
  edited:     { icon: 'settings', fg: 'text-ink-700 dark:text-ink-200', bg: 'bg-ink-50 dark:bg-ink-800/60' },
  published:  { icon: 'check',    fg: 'text-signal-green',           bg: 'bg-signal-green/10' },
  archived:   { icon: 'box',      fg: 'text-signal-red',             bg: 'bg-signal-red/10' },
  restored:   { icon: 'check',    fg: 'text-signal-green',           bg: 'bg-signal-green/10' },
  superseded: { icon: 'layers',   fg: 'text-ink-500 dark:text-ink-400', bg: 'bg-ink-100 dark:bg-ink-800' },
  duplicated: { icon: 'layers',   fg: 'text-accent-500',             bg: 'bg-accent-500/10' },
}

function verbFor(action: TemplateVersionChange['action']): string {
  switch (action) {
    case 'created':    return 'created'
    case 'edited':     return 'started revision of'
    case 'published':  return 'published'
    case 'archived':   return 'archived'
    case 'restored':   return 'restored'
    case 'superseded': return 'superseded'
    case 'duplicated': return 'duplicated from another template into'
  }
}

/* ============================================================
 * Shared sub-components
 * ============================================================ */

function Breadcrumb({
  onBack,
  templateName,
}: {
  onBack: () => void
  templateName?: string
}) {
  const nav = useNav()
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
      <span>System Admin</span>
      <Icon name="chevron_right" className="w-3 h-3" />
      <button
        onClick={() => nav.push('/admin/templates')}
        className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
      >
        Templates
      </button>
      {templateName && (
        <>
          <Icon name="chevron_right" className="w-3 h-3" />
          <button
            onClick={onBack}
            className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors truncate max-w-[360px]"
          >
            {templateName}
          </button>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50">History</span>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-ink-900 p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
        {label}
      </div>
      <div className="mt-3 font-display text-[28px] leading-none tracking-tight text-ink-900 dark:text-ink-50">
        {value}
      </div>
    </div>
  )
}
