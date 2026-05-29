import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useUsers } from '../../../lib/users'
import {
  useInspections,
  formatRelativeTime,
  flattenIssues,
} from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import { Avatar } from '../../../components/primitives/Avatar'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { Modal } from '../../../components/primitives/Modal'
import type { InspectionTimelineEvent, InspectionDomain } from '../../../types/inspection'
import type { IconName } from '../../../types/role'

export function IssueDetailPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const { issueId } = useParams<{ issueId: string }>()
  const nav = useNav()
  const prefix = domain === 'safety' ? '/sm' : '/qm'
  const { user } = useSession()
  const { users } = useUsers()
  const { inspections, verifyIssue, reopenIssue, reassignIssue } = useInspections()
  const { getById: getTemplateById } = useTemplates()

  const [verifyModal, setVerifyModal] = useState<'verify' | 'reopen' | null>(null)
  const [verifyNote, setVerifyNote] = useState('')
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [reassignNote, setReassignNote] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Find the issue and its parent inspection
  const flattened = useMemo(() => flattenIssues(inspections.filter(i => i.domain === domain)), [inspections, domain])
  const context = flattened.find(f => f.issue.id === issueId)
  
  if (!context) {
    return (
      <div className="stagger max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb onBack={() => nav.push(`${prefix}/issues`)} />
        <NotFoundCard
          title="Issue not found"
          message={`The issue ID ${issueId} doesn't exist or has been removed.`}
          backLabel="Back to issues"
          onBack={() => nav.push(`${prefix}/issues`)}
        />
      </div>
    )
  }

  const { issue, inspection } = context
  const template = getTemplateById(inspection.templateId)

  // Find the original item and response
  const response = inspection.responses.find(r => r.itemId === issue.itemId)
  const originalItem = template?.sections.flatMap(s => s.items).find(i => i.id === issue.itemId)
  const originalSection = template?.sections.find(s => s.items.some(i => i.id === issue.itemId))

  // Derived state
  const employeeUsers = users.filter(u => u.role === 'employee')
  
  // Timeline events for this issue
  const timeline = [...inspection.timeline]
    .filter(e => e.target === issue.id || (e.action === 'issue_created' && e.target === issue.id))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  // Banners
  const getBannerConfig = (): { tone: 'green' | 'amber' | 'red' | 'neutral', icon: IconName, label: string, message: string } | null => {
    switch (issue.state) {
      case 'open':
        return { tone: 'amber', icon: 'alert', label: 'Unassigned or pending', message: 'This issue has not been picked up by anyone yet.' }
      case 'in_progress':
        return { tone: 'neutral', icon: 'user', label: 'In progress', message: `${issue.assigneeName ?? 'Someone'} is working on the corrective action.` }
      case 'awaiting_verification':
        return { tone: 'amber', icon: 'alert', label: 'Ready for review', message: `${issue.assigneeName ?? 'The assignee'} submitted a fix and is awaiting your verification.` }
      case 'closed':
        return { tone: 'green', icon: 'check', label: 'Verified closed', message: `This issue was verified closed by ${issue.reviewNotes ? 'you or another manager' : 'a manager'}.` }
      case 'reopened':
        return { tone: 'red', icon: 'alert', label: 'Reopened', message: 'Reopened — see review notes below for what still needs to be done.' }
      default:
        return null
    }
  }
  const banner = getBannerConfig()

  // Actions
  const handleVerifyReopen = () => {
    if (!user || !verifyModal) return
    setSubmitting(true)
    setTimeout(() => {
      if (verifyModal === 'verify') {
        verifyIssue(inspection.id, issue.id, user.email, user.name, verifyNote.trim() || undefined)
      } else {
        reopenIssue(inspection.id, issue.id, user.email, user.name, verifyNote.trim())
      }
      setSubmitting(false)
      setVerifyModal(null)
      setVerifyNote('')
    }, 240)
  }

  const handleReassign = () => {
    if (!user || !selectedAssignee || !reassignNote.trim()) return
    const newAssignee = users.find(u => u.id === selectedAssignee)
    if (!newAssignee) return

    setSubmitting(true)
    setTimeout(() => {
      reassignIssue(inspection.id, issue.id, newAssignee.id, newAssignee.name, user.email, user.name, reassignNote.trim())
      setSubmitting(false)
      setReassignModalOpen(false)
      setReassignNote('')
      setSelectedAssignee('')
    }, 240)
  }

  return (
    <div className="stagger max-w-[1400px] mx-auto px-6 py-8">
      <Breadcrumb
        onBack={() => nav.push(`${prefix}/issues`)}
        issueId={issue.id}
      />

      {banner && (
        <Banner tone={banner.tone} icon={banner.icon} label={banner.label} message={banner.message} />
      )}

      {/* ============ Hero ============ */}
      <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
        <div className="min-w-0 max-w-[680px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-ink-700 dark:text-ink-200 px-2 py-0.5 rounded border hairline">
              {issue.id}
            </span>
            <button
              onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
              className="font-mono text-[11px] text-accent-600 dark:text-accent-400 hover:underline px-2 py-0.5 rounded border hairline border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/30 transition-colors"
            >
              {inspection.number}
            </button>
            <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">
              {inspection.templateName} v{inspection.templateVersion}
            </span>
            <IssueStatePill state={issue.state} />
          </div>
          <h1 className="mt-4 font-display text-[32px] leading-[1.1] tracking-tight text-ink-900 dark:text-ink-50">
            {issue.itemPrompt}
          </h1>
        </div>

        {/* Action cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            <Icon name="arrow_right" className="w-3.5 h-3.5" />
            View parent inspection
          </button>
          
          {(issue.state === 'open' || issue.state === 'in_progress') && (
            <button
              onClick={() => setReassignModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              <Icon name="users" className="w-3.5 h-3.5" />
              Reassign
            </button>
          )}

          {issue.state === 'awaiting_verification' && (
            <>
              <button
                onClick={() => setVerifyModal('reopen')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-signal-red text-signal-red text-[12px] font-medium hover:bg-signal-red/5 transition-colors"
              >
                <Icon name="close" className="w-3.5 h-3.5" />
                Reopen
              </button>
              <button
                onClick={() => setVerifyModal('verify')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-signal-green text-white text-[12px] font-medium hover:bg-signal-green/90 transition-colors"
              >
                <Icon name="check" className="w-3.5 h-3.5" />
                Verify
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============ Stat row ============ */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
        <Stat label="Age" value={formatRelativeTime(issue.createdAt).replace(' ago', '')} tone={Date.now() - new Date(issue.createdAt).getTime() > SEVEN_DAYS_MS && issue.state !== 'closed' ? 'red' : undefined} />
        <Stat label="State" value={issue.state.replace('_', ' ')} capitalize />
        <Stat label="Assignee" value={issue.assigneeName ?? 'Unassigned'} />
        <Stat label="Site" value={inspection.siteName} />
        <Stat label="Last update" value={formatRelativeTime(issue.updatedAt)} />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original finding */}
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Original finding</div>
            </div>
            <div className="p-5">
              {originalSection && (
                <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                  {originalSection.title}
                </div>
              )}
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mb-4">
                {issue.itemPrompt}
              </div>
              
              {response ? (
                <div className="space-y-4 border-l-2 border-signal-red/40 pl-4 ml-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-signal-red/10 text-signal-red text-[12px] font-medium">
                    <Icon name="close" className="w-3.5 h-3.5" />
                    Fail
                    {response.reading != null && <span className="font-mono text-[11px] ml-1 opacity-80">{response.reading} {originalItem?.numericUnit}</span>}
                  </div>

                  {response.observation && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-signal-red/80 font-medium mb-1">Observation</div>
                      <p className="text-[13px] text-ink-700 dark:text-ink-200 leading-relaxed">{response.observation}</p>
                    </div>
                  )}

                  {response.attachments && response.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {response.attachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 border hairline">
                          <Icon name="link" className="w-3 h-3" />
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-ink-500 italic">Finding data unavailable.</div>
              )}
            </div>
          </div>

          {/* Fix evidence */}
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Fix evidence</div>
            </div>
            <div className="p-5">
              {issue.state === 'open' || issue.state === 'in_progress' ? (
                <div className="text-[13px] text-ink-500 italic text-center py-6">
                  No fix submitted yet.
                </div>
              ) : (
                <div className="space-y-4 border-l-2 border-signal-green/40 pl-4 ml-1">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-signal-green/80 font-medium mb-1">Submitted notes</div>
                    <p className="text-[13px] text-ink-700 dark:text-ink-200 leading-relaxed">
                      {issue.fixNotes || <span className="italic text-ink-400">No notes provided.</span>}
                    </p>
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400 font-mono">
                    Submitted {formatRelativeTime(issue.fixSubmittedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review notes */}
          {(issue.state === 'closed' || issue.state === 'reopened') && issue.reviewNotes && (
            <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-5 py-4 border-b hairline">
                <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Review notes</div>
              </div>
              <div className="p-5 border-l-2 border-ink-200 dark:border-ink-700 pl-4 ml-1">
                <p className="text-[13px] text-ink-700 dark:text-ink-200 leading-relaxed">
                  {issue.reviewNotes}
                </p>
                <div className="mt-3 text-[11px] text-ink-500 dark:text-ink-400 font-mono">
                  Reviewed {formatRelativeTime(issue.verifiedAt || issue.updatedAt)}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Assignee</div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={issue.assigneeName ?? '?'} size="w-10 h-10 text-[14px]" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Assigned to</div>
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mt-0.5">{issue.assigneeName ?? 'Unassigned'}</div>
                </div>
              </div>
              {(issue.state === 'open' || issue.state === 'in_progress') && (
                <button
                  onClick={() => setReassignModalOpen(true)}
                  className="mt-4 w-full py-2 rounded border hairline bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 text-[12px] font-medium transition-colors"
                >
                  Reassign
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Inspection Context</div>
            </div>
            <div className="p-4 space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-ink-400">Inspection</span>
                <button onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)} className="text-accent-600 dark:text-accent-400 hover:underline font-mono">
                  {inspection.number}
                </button>
              </div>
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t hairline">
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Template</span>
                <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.templateName}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t hairline">
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Location</span>
                <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.siteName}{inspection.area ? ` · ${inspection.area}` : ''}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t hairline">
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Inspector</span>
                <span className="text-ink-900 dark:text-ink-50 font-medium">{inspection.inspectorName}</span>
              </div>
            </div>
          </div>

          <TimelinePanel timeline={timeline} />
        </div>
      </div>

      {/* Verify / Reopen Modal */}
      <Modal
        open={!!verifyModal}
        onClose={() => {
          if (submitting) return
          setVerifyModal(null)
          setVerifyNote('')
        }}
        title={verifyModal === 'verify' ? 'Close this corrective action?' : 'Reopen this corrective action?'}
        description={
          verifyModal === 'verify'
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
              onClick={handleVerifyReopen}
              disabled={submitting || (verifyModal === 'reopen' && !verifyNote.trim())}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-[13px] font-medium transition-colors disabled:opacity-50 ${
                verifyModal === 'verify'
                  ? 'bg-signal-green hover:bg-signal-green/90'
                  : 'bg-signal-red hover:bg-signal-red/90'
              }`}
            >
              {submitting
                ? 'Saving…'
                : verifyModal === 'verify' ? 'Close issue' : 'Reopen issue'}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="verify-note" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">
            {verifyModal === 'verify' ? 'Optional note' : 'What still needs to be done?'}
          </label>
          <textarea
            id="verify-note"
            value={verifyNote}
            onChange={(e) => setVerifyNote(e.target.value)}
            placeholder={verifyModal === 'verify' ? 'Anything to note for the audit trail…' : 'Be specific so the assignee knows what to fix.'}
            rows={3}
            className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
          />
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        open={reassignModalOpen}
        onClose={() => {
          if (submitting) return
          setReassignModalOpen(false)
          setReassignNote('')
          setSelectedAssignee('')
        }}
        title="Reassign this issue?"
        description="Select a new assignee to handle this corrective action."
        size="md"
        dismissOnBackdrop={!submitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReassign}
              disabled={submitting || !selectedAssignee || !reassignNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-500 text-white text-[13px] font-medium transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              {submitting ? 'Reassigning…' : 'Reassign'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">New Assignee</label>
            <div className="relative">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="focus-ring appearance-none w-full pl-3 pr-9 py-2.5 rounded-md border hairline bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select an employee…</option>
                {employeeUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">Reason (required)</label>
            <textarea
              value={reassignNote}
              onChange={(e) => setReassignNote(e.target.value)}
              placeholder="Why is this being reassigned?"
              rows={3}
              className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
            />
          </div>
        </div>
      </Modal>

    </div>
  )
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function Stat({ label, value, tone, capitalize }: { label: string; value: string; tone?: 'green' | 'amber' | 'red'; capitalize?: boolean }) {
  const colorClass = tone === 'green' ? 'text-signal-green' : tone === 'amber' ? 'text-signal-amber' : tone === 'red' ? 'text-signal-red' : 'text-ink-900 dark:text-ink-50'
  return (
    <div className="bg-white dark:bg-ink-900 px-5 py-4 flex flex-col justify-center">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
        {label}
      </div>
      <div className={`mt-1 font-display text-[24px] ${colorClass} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function Banner({ tone, icon, label, message }: { tone: 'green' | 'amber' | 'red' | 'neutral', icon: IconName, label: string, message: string }) {
  const bg = tone === 'green' ? 'bg-signal-green/10 border-signal-green/20 text-signal-green' : 
             tone === 'amber' ? 'bg-signal-amber/10 border-signal-amber/20 text-signal-amber' : 
             tone === 'red' ? 'bg-signal-red/10 border-signal-red/20 text-signal-red' : 
             'bg-ink-100 border-ink-200 dark:bg-ink-800 dark:border-ink-700 text-ink-700 dark:text-ink-200'
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

function Breadcrumb({ onBack, issueId }: { onBack: () => void, issueId?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
      <button onClick={onBack} className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors flex items-center gap-1">
        <Icon name="arrow_left" className="w-3 h-3" />
        Issues
      </button>
      {issueId && (
        <>
          <Icon name="chevron_right" className="w-3 h-3" />
          <span className="text-ink-900 dark:text-ink-50 font-mono">{issueId}</span>
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

function TimelinePanel({ timeline }: { timeline: InspectionTimelineEvent[] }) {
  if (timeline.length === 0) return null
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
                <span className="font-medium">{event.byName}</span> {event.action.replace(/issue_/g, '').replace(/_/g, ' ')}
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
