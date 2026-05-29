import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import {
  useInspections,
  formatRelativeTime,
  formatDate,
  formatClockTime,
} from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import { StatusPill } from '../../../components/primitives/StatusPill'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { Avatar } from '../../../components/primitives/Avatar'
import { Modal } from '../../../components/primitives/Modal'
import type {
  Inspection,
  InspectionIssue,
  InspectionItemResponse,
  InspectionTimelineEvent,
  InspectionDomain,
} from '../../../types/inspection'
import {
  STATUS_LABEL,
  STATUS_TONE,
  getResponseSummary,
  getIssueSummary,
} from '../../../types/inspection'
import type {
  TemplateItem,
  TemplateSection,
} from '../../../types/template'
import type { IconName } from '../../../types/role'

export function InspectionDetailPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const { id } = useParams<{ id: string }>()
  const { getById, approve, reject, verifyIssue, reopenIssue } = useInspections()
  const { getById: getTemplateById } = useTemplates()
  const { user } = useSession()
  const nav = useNav()
  const prefix = domain === 'safety' ? '/sm' : '/qm'

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [verifyModal, setVerifyModal] = useState<{ issue: InspectionIssue; mode: 'verify' | 'reopen' } | null>(null)
  const [verifyNote, setVerifyNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inspection = id ? getById(id) : undefined
  const template = inspection ? getTemplateById(inspection.templateId) : undefined

  if (!inspection) {
    return (
      <div className="stagger">
        <Breadcrumb onBack={() => nav.push(`${prefix}/inspections`)} />
        <NotFoundCard
          title="Inspection not found"
          message={`The inspection ID ${id} doesn't exist or has been removed.`}
          backLabel="Back to inspections"
          onBack={() => nav.push(`${prefix}/inspections`)}
        />
      </div>
    )
  }

  const responseSummary = getResponseSummary(inspection)
  const issueSummary = getIssueSummary(inspection)

  /* ============ Actions ============ */

  const canApprove = inspection.status === 'submitted' || inspection.status === 'under_review'
  const canReject  = inspection.status === 'submitted' || inspection.status === 'under_review'

  const handleApprove = () => {
    if (!user || !canApprove) return
    setSubmitting(true)
    setTimeout(() => {
      approve(inspection.id, user.email, user.name)
      setSubmitting(false)
    }, 240)
  }

  const handleReject = () => {
    if (!user || !canReject || !rejectNote.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      reject(inspection.id, user.email, user.name, rejectNote.trim())
      setSubmitting(false)
      setRejectModalOpen(false)
      setRejectNote('')
    }, 240)
  }

  const handleVerify = () => {
    if (!user || !verifyModal) return
    setSubmitting(true)
    setTimeout(() => {
      if (verifyModal.mode === 'verify') {
        verifyIssue(inspection.id, verifyModal.issue.id, user.email, user.name, verifyNote.trim() || undefined)
      } else {
        if (!verifyNote.trim()) {
          setSubmitting(false)
          return
        }
        reopenIssue(inspection.id, verifyModal.issue.id, user.email, user.name, verifyNote.trim())
      }
      setSubmitting(false)
      setVerifyModal(null)
      setVerifyNote('')
    }, 240)
  }

  return (
    <div className="stagger">
      <Breadcrumb
        onBack={() => nav.push(`${prefix}/inspections`)}
        inspectionNumber={inspection.number}
      />

      {/* ============ Status banners ============ */}
      {inspection.status === 'rejected' && (
        <Banner
          tone="red"
          icon="alert"
          label="This inspection was rejected"
          message={`Sent back to ${inspection.inspectorName} for rework. They'll receive a notification with your feedback.`}
        />
      )}
      {inspection.status === 'on_hold' && inspection.holdReason && (
        <Banner tone="amber" icon="alert" label="Inspection is on hold" message={inspection.holdReason} />
      )}
      {inspection.status === 'issues_open' && (
        <Banner
          tone="amber"
          icon="alert"
          label="Approved with open issues"
          message={`${issueSummary.total - issueSummary.closed} corrective action${issueSummary.total - issueSummary.closed === 1 ? ' is' : 's are'} in progress. The report cannot publish until all issues are verified closed.`}
        />
      )}
      {inspection.status === 'issues_closed' && (
        <Banner
          tone="green"
          icon="check"
          label="All issues verified closed"
          message="Ready to publish the final report. Publishing distributes it to stakeholders and marks the inspection complete."
        />
      )}

      {/* ============ Hero ============ */}
      <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
        <div className="min-w-0 max-w-[680px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-ink-700 dark:text-ink-200 px-2 py-0.5 rounded border hairline">
              {inspection.number}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500 dark:text-ink-400">
              <Icon name={inspection.domain === 'quality' ? 'badge' : 'shield'} className="w-3 h-3" />
              {inspection.domain === 'quality' ? 'Quality' : 'Safety'}
            </span>
            <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">v{inspection.templateVersion}</span>
            <StatusPill tone={STATUS_TONE[inspection.status]}>{STATUS_LABEL[inspection.status]}</StatusPill>
          </div>
          <h1 className="mt-3 font-display text-[36px] leading-[1.1] tracking-tight text-ink-900 dark:text-ink-50">
            {inspection.templateName}
          </h1>
          <p className="mt-2 text-[14px] text-ink-600 dark:text-ink-300">
            {inspection.area ? `${inspection.area} · ` : ''}{inspection.siteName}
            {' · '}
            <span className="text-ink-500 dark:text-ink-400">
              {formatDate(inspection.scheduledFor)} at {formatClockTime(inspection.scheduledFor)}
            </span>
          </p>
        </div>

        {/* Action cluster — state-aware */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => template && nav.push(`/admin/templates/${template.id}`)}
            disabled={!template}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="file" className="w-3.5 h-3.5" />
            View template
          </button>
          {canReject && (
            <button
              onClick={() => setRejectModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-signal-red hover:bg-signal-red/5 transition-colors"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
              Reject
            </button>
          )}
          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-signal-green text-white text-[12px] font-medium hover:bg-signal-green/90 transition-colors disabled:opacity-60"
            >
              <Icon name="check" className="w-3.5 h-3.5" />
              {submitting ? 'Approving…' : 'Approve'}
            </button>
          )}
        </div>
      </div>

      {/* ============ Stat row ============ */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
        <Stat label="Items"      value={`${responseSummary.total - responseSummary.skipped} / ${responseSummary.total}`} />
        <Stat label="Passes"     value={String(responseSummary.pass)} tone="green" />
        <Stat label="Fails"      value={String(responseSummary.fail)} tone={responseSummary.fail > 0 ? 'red' : undefined} />
        <Stat label="Issues open" value={String(issueSummary.total - issueSummary.closed)} tone={issueSummary.total - issueSummary.closed > 0 ? 'amber' : undefined} />
        <Stat label="Last updated" value={formatRelativeTime(inspection.updatedAt)} />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection structure */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[24px] tracking-tight text-ink-900 dark:text-ink-50">
              Responses
            </h2>
            {!template && (
              <span className="text-[11px] text-signal-amber font-mono">template no longer in storage</span>
            )}
          </div>

          {template ? (
            template.sections.map((section, idx) => (
              <SectionWithResponses
                key={section.id}
                section={section}
                index={idx}
                responses={inspection.responses}
                issues={inspection.issues}
              />
            ))
          ) : (
            <div className="rounded-xl border hairline border-dashed p-8 text-center text-[12px] text-ink-500 dark:text-ink-400">
              Could not load the template structure. The responses below are still in the inspection record.
            </div>
          )}

          {/* Fallback flat list of responses if template is missing */}
          {!template && inspection.responses.length > 0 && (
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <ul className="divide-y hairline">
                {inspection.responses.map((r, i) => (
                  <li key={i} className="px-5 py-3 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-ink-400 dark:text-ink-500 w-16 shrink-0">{r.itemId}</span>
                    <AnswerChip answer={r.answer} reading={r.reading} textAnswer={r.textAnswer} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <IssuesPanel
            inspection={inspection}
            onOpenIssue={(issue, mode) => {
              setVerifyModal({ issue, mode })
              setVerifyNote('')
            }}
          />

          <PeoplePanel inspection={inspection} />

          <DetailsPanel inspection={inspection} />

          <TimelinePanel timeline={inspection.timeline} />
        </div>
      </div>

      {/* ============ Reject modal ============ */}
      <Modal
        open={rejectModalOpen}
        onClose={() => {
          if (submitting) return
          setRejectModalOpen(false)
          setRejectNote('')
        }}
        title="Reject this submission?"
        description={`${inspection.inspectorName} will see this feedback and can resubmit after addressing it.`}
        size="md"
        dismissOnBackdrop={!submitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-signal-red text-white text-[13px] font-medium hover:bg-signal-red/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send back to inspector'}
            </button>
          </>
        }
      >
        <label htmlFor="reject-note" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">
          Reason
        </label>
        <textarea
          id="reject-note"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="What needs to be addressed before this can be approved?"
          rows={4}
          className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
        />
        <p className="mt-1.5 text-[11px] text-ink-500 dark:text-ink-400">
          This message appears in the timeline and on the inspector's "Returned" list.
        </p>
      </Modal>

      {/* ============ Verify / Reopen issue modal ============ */}
      <Modal
        open={!!verifyModal}
        onClose={() => {
          if (submitting) return
          setVerifyModal(null)
          setVerifyNote('')
        }}
        title={verifyModal?.mode === 'verify' ? 'Close this corrective action?' : 'Reopen this corrective action?'}
        description={
          verifyModal?.mode === 'verify'
            ? 'The fix evidence will be accepted as sufficient and the issue will be marked closed.'
            : 'The fix will be sent back to the assignee for further work.'
        }
        size="md"
        dismissOnBackdrop={!submitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => setVerifyModal(null)}
              disabled={submitting}
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={submitting || (verifyModal?.mode === 'reopen' && !verifyNote.trim())}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-[13px] font-medium transition-colors disabled:opacity-50 ${
                verifyModal?.mode === 'verify'
                  ? 'bg-signal-green hover:bg-signal-green/90'
                  : 'bg-signal-red hover:bg-signal-red/90'
              }`}
            >
              {submitting
                ? 'Saving…'
                : verifyModal?.mode === 'verify' ? 'Close issue' : 'Reopen issue'}
            </button>
          </>
        }
      >
        {verifyModal && (
          <div className="space-y-4">
            <div className="rounded-md border hairline bg-ink-50/50 dark:bg-ink-950/30 p-3.5">
              <div className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                Original issue
              </div>
              <div className="mt-1 text-[13px] text-ink-900 dark:text-ink-50">
                {verifyModal.issue.itemPrompt}
              </div>
              {verifyModal.issue.fixNotes && (
                <div className="mt-2 text-[12px] text-ink-700 dark:text-ink-200">
                  <span className="text-ink-500 dark:text-ink-400">Assignee notes: </span>
                  {verifyModal.issue.fixNotes}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="verify-note" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">
                {verifyModal.mode === 'verify' ? 'Optional note' : 'What still needs to be done?'}
              </label>
              <textarea
                id="verify-note"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder={verifyModal.mode === 'verify' ? 'Anything to note for the audit trail…' : 'Be specific so the assignee knows what to fix.'}
                rows={3}
                className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ============================================================
 * Major sub-components
 * ============================================================ */

function SectionWithResponses({
  section,
  index,
  responses,
  issues,
}: {
  section: TemplateSection
  index: number
  responses: InspectionItemResponse[]
  issues: InspectionIssue[]
}) {
  const responseMap = useMemo(() => {
    const m = new Map<string, InspectionItemResponse>()
    responses.forEach((r) => m.set(r.itemId, r))
    return m
  }, [responses])
  const issueMap = useMemo(() => {
    const m = new Map<string, InspectionIssue>()
    issues.forEach((iss) => m.set(iss.itemId, iss))
    return m
  }, [issues])

  return (
    <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
      <div className="px-5 py-4 border-b hairline flex items-start gap-4">
        <div className="font-mono text-[11px] text-ink-400 dark:text-ink-500 mt-0.5 shrink-0 w-6">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-ink-900 dark:text-ink-50">{section.title}</div>
          {section.description && (
            <p className="mt-1 text-[12px] text-ink-500 dark:text-ink-400 leading-relaxed">{section.description}</p>
          )}
        </div>
        <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400 shrink-0">
          {section.items.length} item{section.items.length === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="divide-y hairline">
        {section.items.map((item, idx) => (
          <ResponseItemRow
            key={item.id}
            item={item}
            index={idx}
            response={responseMap.get(item.id)}
            issue={issueMap.get(item.id)}
          />
        ))}
      </ul>
    </div>
  )
}

function ResponseItemRow({
  item,
  index,
  response,
  issue,
}: {
  item: TemplateItem
  index: number
  response?: InspectionItemResponse
  issue?: InspectionIssue
}) {
  const answer = response?.answer ?? null
  const isFail = answer === 'fail'
  const isNA   = answer === 'na'

  return (
    <li
      className={`px-5 py-3.5 ${
        isFail ? 'bg-signal-red/[0.03] dark:bg-signal-red/5' :
        isNA   ? 'bg-ink-50/40 dark:bg-ink-950/20' :
        ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="font-mono text-[10px] text-ink-400 dark:text-ink-500 mt-1 shrink-0 w-6">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          {/* Prompt */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-ink-900 dark:text-ink-50">
                {item.prompt}
                {item.required && (
                  <span className="ml-1 text-signal-red font-mono text-[11px]" title="Required">*</span>
                )}
              </div>

              {/* Numeric bounds reference */}
              {item.type === 'numeric' && (item.numericMin != null || item.numericMax != null) && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-500 dark:text-ink-400">
                  <span className="text-ink-400 dark:text-ink-500">range</span>
                  <span>{item.numericMin ?? '−∞'} — {item.numericMax ?? '+∞'} {item.numericUnit ?? ''}</span>
                </div>
              )}

              {/* Reference */}
              {item.reference && (
                <div className="mt-1 text-[11px] text-ink-500 dark:text-ink-400 font-mono inline-flex items-center gap-1">
                  <Icon name="file" className="w-3 h-3" />
                  {item.reference}
                </div>
              )}
            </div>

            {/* Answer chip */}
            <AnswerChip answer={answer} reading={response?.reading} textAnswer={response?.textAnswer} item={item} />
          </div>

          {/* Observation */}
          {response?.observation && (
            <div className="mt-2.5 ml-0 pl-3 border-l-2 border-signal-red/40">
              <div className="text-[10px] uppercase tracking-[0.12em] text-signal-red/80 font-medium">Observation</div>
              <p className="mt-0.5 text-[12px] text-ink-700 dark:text-ink-200 leading-relaxed">{response.observation}</p>
            </div>
          )}

          {/* Attachments */}
          {response?.attachments && response.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {response.attachments.map((att, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800"
                  title={att}
                >
                  <Icon name="link" className="w-3 h-3" />
                  {att}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issue status or Create Issue (read-only for manager mostly, unless verifying) */}
        <div className="shrink-0 w-32 flex justify-end">
          {issue ? (
            <IssueStatePill state={issue.state} />
          ) : null}
        </div>
      </div>
    </li>
  )
}

function AnswerChip({ answer, reading, textAnswer, item }: { answer: string | null, reading?: number | null, textAnswer?: string, item?: TemplateItem }) {
  if (answer === 'pass') {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-signal-green/10 text-signal-green text-[12px] font-medium">
        <Icon name="check" className="w-3.5 h-3.5" />
        Pass
        {reading != null && <span className="font-mono text-[11px] ml-1 opacity-80">{reading} {item?.numericUnit}</span>}
      </div>
    )
  }
  if (answer === 'fail') {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-signal-red/10 text-signal-red text-[12px] font-medium">
        <Icon name="close" className="w-3.5 h-3.5" />
        Fail
        {reading != null && <span className="font-mono text-[11px] ml-1 opacity-80">{reading} {item?.numericUnit}</span>}
      </div>
    )
  }
  if (answer === 'na') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-300 text-[12px] font-medium">
        N/A
      </div>
    )
  }
  if (textAnswer) {
    return (
      <div className="text-[13px] text-ink-900 dark:text-ink-50 font-medium">
        {textAnswer}
      </div>
    )
  }
  return <div className="text-[12px] text-ink-400 dark:text-ink-500 italic">Unanswered</div>
}

function IssuesPanel({ inspection, onOpenIssue }: { inspection: Inspection, onOpenIssue: (i: InspectionIssue, mode: 'verify' | 'reopen') => void }) {
  if (inspection.issues.length === 0) return null

  return (
    <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
      <div className="px-5 py-4 border-b hairline flex items-center justify-between">
        <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Corrective actions</div>
        <StatusPill tone="amber">{inspection.issues.length}</StatusPill>
      </div>
      <div className="divide-y hairline">
        {inspection.issues.map((issue) => (
          <div key={issue.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[12px] font-medium text-ink-900 dark:text-ink-50 line-clamp-2">
                {issue.itemPrompt}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-ink-500 dark:text-ink-400 flex items-center gap-1.5 flex-wrap">
              <Icon name="user" className="w-3 h-3" />
              {issue.assigneeName ?? 'Unassigned'}
              <span className="opacity-50">·</span>
              <span className="capitalize">{issue.state.replace('_', ' ')}</span>
            </div>
            {issue.state === 'awaiting_verification' && (
              <button
                onClick={() => onOpenIssue(issue, 'verify')}
                className="mt-3 w-full py-1.5 rounded bg-signal-amber/10 text-signal-amber hover:bg-signal-amber/20 text-[11px] font-medium transition-colors"
              >
                Verify fix
              </button>
            )}
            {issue.state === 'closed' && (
              <button
                onClick={() => onOpenIssue(issue, 'reopen')}
                className="mt-3 w-full py-1.5 rounded bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 text-[11px] font-medium transition-colors"
              >
                Reopen issue
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PeoplePanel({ inspection }: { inspection: Inspection }) {
  return (
    <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
      <div className="px-5 py-4 border-b hairline">
        <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">People</div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={inspection.inspectorName ?? '?'} size="w-8 h-8 text-[11px]" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Inspector</div>
            <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5">{inspection.inspectorName ?? 'Unassigned'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={inspection.managerName} size="w-8 h-8 text-[11px]" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Manager</div>
            <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5">{inspection.managerName}</div>
          </div>
        </div>
        {inspection.auditeeName && (
          <div className="flex items-center gap-3">
            <Avatar name={inspection.auditeeName} size="w-8 h-8 text-[11px]" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Auditee</div>
              <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 mt-0.5">{inspection.auditeeName}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailsPanel({ inspection }: { inspection: Inspection }) {
  return (
    <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
      <div className="px-5 py-4 border-b hairline">
        <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Details</div>
      </div>
      <div className="p-4 space-y-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-ink-500 dark:text-ink-400">Site</span>
          <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.siteName}</span>
        </div>
        {inspection.area && (
          <div className="flex justify-between">
            <span className="text-ink-500 dark:text-ink-400">Area</span>
            <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.area}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-500 dark:text-ink-400">Scheduled</span>
          <span className="text-ink-900 dark:text-ink-50 font-medium font-mono">{formatDate(inspection.scheduledFor)}</span>
        </div>
      </div>
    </div>
  )
}

function TimelinePanel({ timeline }: { timeline: InspectionTimelineEvent[] }) {
  return (
    <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
      <div className="px-5 py-4 border-b hairline">
        <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Timeline</div>
      </div>
      <div className="p-5">
        <div className="relative border-l-2 border-ink-100 dark:border-ink-800 ml-2 space-y-6 pb-2">
          {timeline.map((event, i) => (
            <div key={event.id} className="relative pl-5">
              <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${i === 0 ? 'bg-ink-900 dark:bg-ink-50 ring-4 ring-white dark:ring-ink-900' : 'bg-ink-300 dark:bg-ink-600'}`} />
              <div className="text-[12px] text-ink-900 dark:text-ink-50 leading-snug">
                <span className="font-medium">{event.byName}</span> {event.action.replace('_', ' ')}
              </div>
              {event.note && (
                <div className="mt-1 text-[12px] text-ink-600 dark:text-ink-300 italic leading-relaxed">
                  "{event.note}"
                </div>
              )}
              <div className="mt-1 text-[10px] font-mono text-ink-400 dark:text-ink-500">
                {formatRelativeTime(event.at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'amber' | 'red' }) {
  const colorClass = tone === 'green' ? 'text-signal-green' : tone === 'amber' ? 'text-signal-amber' : tone === 'red' ? 'text-signal-red' : 'text-ink-900 dark:text-ink-50'
  return (
    <div className="bg-white dark:bg-ink-900 px-5 py-4 flex flex-col justify-center">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
        {label}
      </div>
      <div className={`mt-1 font-display text-[24px] ${colorClass}`}>
        {value}
      </div>
    </div>
  )
}

function Banner({ tone, icon, label, message }: { tone: 'green' | 'amber' | 'red', icon: IconName, label: string, message: string }) {
  const bg = tone === 'green' ? 'bg-signal-green/10 border-signal-green/20 text-signal-green' : tone === 'amber' ? 'bg-signal-amber/10 border-signal-amber/20 text-signal-amber' : 'bg-signal-red/10 border-signal-red/20 text-signal-red'
  return (
    <div className={`mt-6 rounded-lg border hairline ${bg} p-4 flex items-start gap-3`}>
      <Icon name={icon} className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        <div className="mt-1 text-[12px] opacity-90 leading-relaxed">{message}</div>
      </div>
    </div>
  )
}

function Breadcrumb({ onBack, inspectionNumber }: { onBack: () => void, inspectionNumber?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
      <button onClick={onBack} className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors flex items-center gap-1">
        <Icon name="arrow_left" className="w-3 h-3" />
        Inspections
      </button>
      {inspectionNumber && (
        <>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50 font-mono">{inspectionNumber}</span>
        </>
      )}
    </div>
  )
}

function NotFoundCard({ title, message, backLabel, onBack }: { title: string, message: string, backLabel: string, onBack: () => void }) {
  return (
    <div className="mt-8 rounded-xl border hairline bg-white dark:bg-ink-900 p-8 text-center max-w-[400px]">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed mb-4">
        <Icon name="alert" className="w-5 h-5 text-signal-red" />
      </div>
      <h2 className="text-[16px] font-medium text-ink-900 dark:text-ink-50">{title}</h2>
      <p className="mt-2 text-[13px] text-ink-500 dark:text-ink-400">{message}</p>
      <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[12px] font-medium hover:bg-accent-600 transition-colors">
        {backLabel}
      </button>
    </div>
  )
}
