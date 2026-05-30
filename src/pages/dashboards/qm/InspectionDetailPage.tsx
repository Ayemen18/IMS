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
import { PageBanner } from '../../../components/shell/PageBanner'
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          onBack={() => nav.push(`${prefix}/inspections`)}
          inspectionNumber={inspection.number}
        />
        {/* Meta badges */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-text-primary bg-accent-light px-2 py-0.5 rounded-lg border border-text-secondary/15">
            {inspection.number}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-text-secondary">
            <Icon name={inspection.domain === 'quality' ? 'badge' : 'shield'} className="w-3.5 h-3.5" />
            {inspection.domain === 'quality' ? 'Quality' : 'Safety'}
          </span>
          <span className="font-mono text-[10px] text-text-secondary font-bold">v{inspection.templateVersion}</span>
          <StatusPill tone={STATUS_TONE[inspection.status]}>{STATUS_LABEL[inspection.status]}</StatusPill>
        </div>
      </div>

      {/* Page Banner */}
      <PageBanner
        title={inspection.templateName}
        subline={`${inspection.area ? `${inspection.area} · ` : ''}${inspection.siteName} · Scheduled for ${formatDate(inspection.scheduledFor)} at ${formatClockTime(inspection.scheduledFor)}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => template && nav.push(`/admin/templates/${template.id}`)}
              disabled={!template}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="file" className="w-3.5 h-3.5" />
              View Template
            </button>
            {canReject && (
              <button
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-fail hover:bg-status-fail/90 text-white text-[12px] font-bold transition-all shadow-sm"
              >
                <Icon name="close" className="w-3.5 h-3.5" />
                Reject
              </button>
            )}
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm disabled:opacity-60"
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                {submitting ? 'Approving…' : 'Approve'}
              </button>
            )}
          </div>
        }
      />

      {/* ============ Status alerts ============ */}
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
          label="Approved with open corrective actions"
          message={`${issueSummary.total - issueSummary.closed} corrective action${issueSummary.total - issueSummary.closed === 1 ? ' is' : 's are'} in progress. The report cannot publish until all issues are verified closed.`}
        />
      )}
      {inspection.status === 'issues_closed' && (
        <Banner
          tone="green"
          icon="check"
          label="All corrective actions verified closed"
          message="Ready to publish the final report. Publishing distributes it to stakeholders and marks the inspection complete."
        />
      )}

      {/* ============ Stat row ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
        <Stat label="Items"      value={`${responseSummary.total - responseSummary.skipped} / ${responseSummary.total}`} />
        <Stat label="Passes"     value={String(responseSummary.pass)} tone="green" />
        <Stat label="Fails"      value={String(responseSummary.fail)} tone={responseSummary.fail > 0 ? 'red' : undefined} />
        <Stat label="Issues Open" value={String(issueSummary.total - issueSummary.closed)} tone={issueSummary.total - issueSummary.closed > 0 ? 'amber' : undefined} />
        <Stat label="Last Updated" value={formatRelativeTime(inspection.updatedAt)} />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection structure */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-bold text-text-primary">
              Responses
            </h2>
            {!template && (
              <span className="text-[11px] text-warning font-mono">template no longer in storage</span>
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
            <div className="rounded-2xl border border-dashed border-text-secondary/15 p-8 text-center text-[12px] text-text-secondary bg-white shadow-soft">
              Could not load the template structure. The responses below are still in the inspection record.
            </div>
          )}

          {/* Fallback flat list of responses if template is missing */}
          {!template && inspection.responses.length > 0 && (
            <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
              <ul className="divide-y divide-text-secondary/15">
                {inspection.responses.map((r, i) => (
                  <li key={i} className="px-5 py-3 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-text-secondary w-16 shrink-0">{r.itemId}</span>
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-bold hover:bg-status-fail/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send back to inspector'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="reject-note" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
              Reason
            </label>
            <textarea
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="What needs to be addressed before this can be approved?"
              rows={4}
              className="focus-ring w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-all shadow-inner resize-none"
            />
            <p className="mt-1.5 text-[11px] text-text-secondary">
              This message appears in the timeline and on the inspector's "Returned" list.
            </p>
          </div>
        </div>
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={submitting || (verifyModal?.mode === 'reopen' && !verifyNote.trim())}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-bold transition-colors disabled:opacity-50 ${ verifyModal?.mode === 'verify' ? 'bg-status-pass hover:bg-status-pass/90' : 'bg-status-fail hover:bg-status-fail/90' }`}
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
            <div className="rounded-xl border border-text-secondary/15 bg-accent-light/50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Original Issue
              </div>
              <div className="mt-1.5 text-[13px] text-text-primary font-medium">
                {verifyModal.issue.itemPrompt}
              </div>
              {verifyModal.issue.fixNotes && (
                <div className="mt-2 text-[12px] text-text-secondary bg-white p-2.5 rounded-lg border border-text-secondary/15">
                  <span className="text-[10px] font-bold uppercase text-text-secondary block mb-0.5">Assignee Notes</span>
                  {verifyModal.issue.fixNotes}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="verify-note" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
                {verifyModal.mode === 'verify' ? 'Optional note' : 'What still needs to be done?'}
              </label>
              <textarea
                id="verify-note"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder={verifyModal.mode === 'verify' ? 'Anything to note for the audit trail…' : 'Be specific so the assignee knows what to fix.'}
                rows={3}
                className="focus-ring w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-all shadow-inner resize-none"
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
    <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
      <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50 flex items-start gap-4">
        <div className="font-mono text-[11px] text-text-secondary mt-0.5 shrink-0 w-6 font-bold">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-text-primary">{section.title}</div>
          {section.description && (
            <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">{section.description}</p>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary shrink-0">
          {section.items.length} item{section.items.length === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="divide-y divide-text-secondary/15">
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
      className={`px-5 py-3.5 transition-colors ${ isFail ? 'bg-status-fail/[0.02]' : isNA ? 'bg-accent-light/20' : '' }`}
    >
      <div className="flex items-start gap-4">
        <div className="font-mono text-[10px] text-text-secondary mt-1 shrink-0 w-6">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          {/* Prompt */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-text-primary font-medium leading-relaxed">
                {item.prompt}
                {item.required && (
                  <span className="ml-1 text-status-fail font-mono text-[11px]" title="Required">*</span>
                )}
              </div>

              {/* Numeric bounds reference */}
              {item.type === 'numeric' && (item.numericMin != null || item.numericMax != null) && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono text-text-secondary font-bold">
                  <span className="text-text-secondary">range:</span>
                  <span>{item.numericMin ?? '−∞'} — {item.numericMax ?? '+∞'} {item.numericUnit ?? ''}</span>
                </div>
              )}

              {/* Reference */}
              {item.reference && (
                <div className="mt-1 text-[11px] text-text-secondary font-mono inline-flex items-center gap-1.5">
                  <Icon name="file" className="w-3 h-3 text-text-secondary" />
                  {item.reference}
                </div>
              )}
            </div>

            {/* Answer chip */}
            <AnswerChip answer={answer} reading={response?.reading} textAnswer={response?.textAnswer} item={item} />
          </div>

          {/* Observation */}
          {response?.observation && (
            <div className="mt-2.5 ml-0 pl-3 border-l-2 border-status-fail/30">
              <div className="text-[10px] uppercase tracking-wider text-status-fail font-bold">Observation</div>
              <p className="mt-0.5 text-[12px] text-text-secondary leading-relaxed font-medium">{response.observation}</p>
            </div>
          )}

          {/* Attachments */}
          {response?.attachments && response.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {response.attachments.map((att, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-text-primary font-bold px-2 py-0.5 rounded bg-accent-light border border-text-secondary/15"
                  title={att}
                >
                  <Icon name="link" className="w-3 h-3 text-text-secondary" />
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
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-pass/10 text-status-pass text-[12px] font-bold">
        <Icon name="check" className="w-3.5 h-3.5" />
        Pass
        {reading != null && <span className="font-mono text-[11px] ml-1 opacity-80 font-bold">{reading} {item?.numericUnit}</span>}
      </div>
    )
  }
  if (answer === 'fail') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-fail/10 text-status-fail text-[12px] font-bold">
        <Icon name="close" className="w-3.5 h-3.5" />
        Fail
        {reading != null && <span className="font-mono text-[11px] ml-1 opacity-80 font-bold">{reading} {item?.numericUnit}</span>}
      </div>
    )
  }
  if (answer === 'na') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent-light text-text-secondary text-[12px] font-bold border border-text-secondary/15">
        N/A
      </div>
    )
  }
  if (textAnswer) {
    return (
      <div className="text-[13px] text-text-primary font-bold">
        {textAnswer}
      </div>
    )
  }
  return <div className="text-[12px] text-text-secondary italic">Unanswered</div>
}

function IssuesPanel({ inspection, onOpenIssue }: { inspection: Inspection, onOpenIssue: (i: InspectionIssue, mode: 'verify' | 'reopen') => void }) {
  if (inspection.issues.length === 0) return null

  return (
    <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
      <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50 flex items-center justify-between">
        <div className="text-[13px] font-bold text-text-primary">Corrective Actions</div>
        <span className="bg-warning/15 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full border border-warning/30">
          {inspection.issues.length}
        </span>
      </div>
      <div className="divide-y divide-text-secondary/15">
        {inspection.issues.map((issue) => (
          <div key={issue.id} className="p-4 space-y-2">
            <div className="text-[12px] font-semibold text-text-primary leading-normal">
              {issue.itemPrompt}
            </div>
            <div className="text-[10px] text-text-secondary flex items-center gap-1.5 flex-wrap font-bold uppercase">
              <Icon name="user" className="w-3.5 h-3.5 text-text-secondary" />
              {issue.assigneeName ?? 'Unassigned'}
              <span className="opacity-50">·</span>
              <span>{issue.state.replace('_', ' ')}</span>
            </div>
            {issue.state === 'awaiting_verification' && (
              <button
                onClick={() => onOpenIssue(issue, 'verify')}
                className="mt-1 w-full py-1.5 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[11px] font-bold transition-colors shadow-sm"
              >
                Verify Fix
              </button>
            )}
            {issue.state === 'closed' && (
              <button
                onClick={() => onOpenIssue(issue, 'reopen')}
                className="mt-1 w-full py-1.5 rounded-lg bg-accent-light text-text-secondary border border-text-secondary/15 hover:bg-accent-light hover:text-text-primary text-[11px] font-bold transition-all"
              >
                Reopen Issue
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
    <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
      <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
        <div className="text-[13px] font-bold text-text-primary">People</div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={inspection.inspectorName ?? '?'} size="w-8 h-8 text-[11px]" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Inspector</div>
            <div className="text-[13px] font-bold text-text-primary mt-0.5">{inspection.inspectorName ?? 'Unassigned'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={inspection.managerName} size="w-8 h-8 text-[11px]" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Manager</div>
            <div className="text-[13px] font-bold text-text-primary mt-0.5">{inspection.managerName}</div>
          </div>
        </div>
        {inspection.auditeeName && (
          <div className="flex items-center gap-3">
            <Avatar name={inspection.auditeeName} size="w-8 h-8 text-[11px]" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Auditee</div>
              <div className="text-[13px] font-bold text-text-primary mt-0.5">{inspection.auditeeName}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailsPanel({ inspection }: { inspection: Inspection }) {
  return (
    <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
      <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
        <div className="text-[13px] font-bold text-text-primary">Details</div>
      </div>
      <div className="p-4 space-y-3 text-[12px]">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary font-bold uppercase text-[10px]">Site</span>
          <span className="text-text-primary font-bold">{inspection.siteName}</span>
        </div>
        {inspection.area && (
          <div className="flex justify-between items-center">
            <span className="text-text-secondary font-bold uppercase text-[10px]">Area</span>
            <span className="text-text-primary font-bold">{inspection.area}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-text-secondary font-bold uppercase text-[10px]">Scheduled</span>
          <span className="text-text-primary font-bold font-mono">{formatDate(inspection.scheduledFor)}</span>
        </div>
      </div>
    </div>
  )
}

function TimelinePanel({ timeline }: { timeline: InspectionTimelineEvent[] }) {
  return (
    <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
      <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
        <div className="text-[13px] font-bold text-text-primary">Timeline</div>
      </div>
      <div className="p-5">
        <div className="relative border-l border-text-secondary/15 ml-2 space-y-6 pb-2">
          {timeline.map((event, i) => (
            <div key={event.id} className="relative pl-5">
              <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${i === 0 ? 'bg-primary ring-4 ring-white' : 'bg-accent-light'}`} />
              <div className="text-[12px] text-text-primary leading-snug font-medium">
                <span className="font-bold">{event.byName}</span> {event.action.replace('_', ' ')}
              </div>
              {event.note && (
                <div className="mt-1 text-[12px] text-text-secondary italic leading-relaxed bg-accent-light/40 p-2 rounded-lg border border-text-secondary/15 inline-block">
                  "{event.note}"
                </div>
              )}
              <div className="mt-1 text-[10px] font-mono text-text-secondary">
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
  const colorClass = tone === 'green' ? 'text-status-pass' : tone === 'amber' ? 'text-warning' : tone === 'red' ? 'text-status-fail' : 'text-text-primary'
  return (
    <div className="bg-white px-5 py-4 flex flex-col justify-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div className={`mt-1 text-[22px] font-bold tracking-tight ${colorClass}`}>
        {value}
      </div>
    </div>
  )
}

function Banner({ tone, icon, label, message }: { tone: 'green' | 'amber' | 'red', icon: IconName, label: string, message: string }) {
  const bg = tone === 'green' ? 'bg-status-pass/10 border-status-pass/20 text-status-pass' : tone === 'amber' ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-status-fail/10 border-status-fail/20 text-status-fail'
  return (
    <div className={`rounded-xl border ${bg} p-4 flex items-start gap-3 shadow-sm`}>
      <Icon name={icon} className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
      <div>
        <div className="text-[13px] font-bold">{label}</div>
        <div className="mt-0.5 text-[12px] opacity-90 leading-relaxed font-medium">{message}</div>
      </div>
    </div>
  )
}

function Breadcrumb({ onBack, inspectionNumber }: { onBack: () => void, inspectionNumber?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
      <button onClick={onBack} className="hover:text-text-primary transition-colors flex items-center gap-1">
        <Icon name="arrow_left" className="w-3.5 h-3.5" />
        Inspections
      </button>
      {inspectionNumber && (
        <>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-primary font-mono">{inspectionNumber}</span>
        </>
      )}
    </div>
  )
}

function NotFoundCard({ title, message, backLabel, onBack }: { title: string, message: string, backLabel: string, onBack: () => void }) {
  return (
    <div className="rounded-2xl border border-text-secondary/15 bg-white p-8 text-center max-w-[400px] mx-auto shadow-soft">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-text-secondary/15 bg-accent-light/50 mb-4">
        <Icon name="alert" className="w-5 h-5 text-status-fail" />
      </div>
      <h2 className="text-[15px] font-bold text-text-primary">{title}</h2>
      <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">{message}</p>
      <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary text-white text-[12px] font-bold transition-colors shadow-sm">
        {backLabel}
      </button>
    </div>
  )
}
