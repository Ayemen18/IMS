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
import { PageBanner } from '../../../components/shell/PageBanner'
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
      <div className="space-y-6">
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
        return { tone: 'amber', icon: 'alert', label: 'Unassigned or Pending', message: 'This issue has not been picked up by anyone yet.' }
      case 'in_progress':
        return { tone: 'neutral', icon: 'user', label: 'In Progress', message: `${issue.assigneeName ?? 'Someone'} is working on the corrective action.` }
      case 'awaiting_verification':
        return { tone: 'amber', icon: 'alert', label: 'Ready for Review', message: `${issue.assigneeName ?? 'The assignee'} submitted a fix and is awaiting your verification.` }
      case 'closed':
        return { tone: 'green', icon: 'check', label: 'Verified Closed', message: `This issue was verified closed by ${issue.reviewNotes ? 'you or another manager' : 'a manager'}.` }
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
    <div className="space-y-6">
      {/* Top Breadcrumb Row with info pills */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          onBack={() => nav.push(`${prefix}/issues`)}
          issueId={issue.id}
        />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-text-primary bg-accent-light px-2 py-0.5 rounded-lg border border-text-secondary/15">
            {issue.id}
          </span>
          <button
            onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
            className="font-mono text-[10px] text-text-primary hover:text-primary bg-accent-light px-2 py-0.5 rounded-lg border border-text-secondary/15 font-bold hover:bg-accent-light transition-colors"
          >
            {inspection.number}
          </button>
          <IssueStatePill state={issue.state} />
        </div>
      </div>

      {banner && (
        <Banner tone={banner.tone} icon={banner.icon} label={banner.label} message={banner.message} />
      )}

      {/* Page Banner with corrective action text as title */}
      <PageBanner
        title={issue.itemPrompt}
        subline={`Raised at ${inspection.siteName} during ${inspection.templateName} v${inspection.templateVersion}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm"
            >
              <Icon name="arrow_right" className="w-3.5 h-3.5" />
              View Parent Inspection
            </button>
            
            {(issue.state === 'open' || issue.state === 'in_progress') && (
              <button
                onClick={() => setReassignModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-[12px] font-bold text-white transition-all shadow-sm"
              >
                <Icon name="users" className="w-3.5 h-3.5" />
                Reassign
              </button>
            )}

            {issue.state === 'awaiting_verification' && (
              <>
                <button
                  onClick={() => setVerifyModal('reopen')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-fail hover:bg-status-fail/90 text-white text-[12px] font-bold transition-all shadow-sm"
                >
                  <Icon name="close" className="w-3.5 h-3.5" />
                  Reopen
                </button>
                <button
                  onClick={() => setVerifyModal('verify')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-text-primary text-[12px] font-bold transition-all shadow-sm"
                >
                  <Icon name="check" className="w-3.5 h-3.5" />
                  Verify Fix
                </button>
              </>
            )}
          </div>
        }
      />

      {/* ============ Stat row ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
        <Stat label="Age" value={formatRelativeTime(issue.createdAt).replace(' ago', '')} tone={Date.now() - new Date(issue.createdAt).getTime() > SEVEN_DAYS_MS && issue.state !== 'closed' ? 'red' : undefined} />
        <Stat label="State" value={issue.state.replace('_', ' ')} capitalize />
        <Stat label="Assignee" value={issue.assigneeName ?? 'Unassigned'} />
        <Stat label="Site" value={inspection.siteName} />
        <Stat label="Last Update" value={formatRelativeTime(issue.updatedAt)} />
      </div>

      {/* ============ Two-column body ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original finding */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Original Finding</div>
            </div>
            <div className="p-5">
              {originalSection && (
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  {originalSection.title}
                </div>
              )}
              <div className="text-[14px] font-bold text-text-primary mb-4">
                {issue.itemPrompt}
              </div>
              
              {response ? (
                <div className="space-y-4 border-l-2 border-status-fail/30 pl-4 ml-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-fail/10 text-status-fail text-[12px] font-bold">
                    <Icon name="close" className="w-3.5 h-3.5" />
                    Fail
                    {response.reading != null && <span className="font-mono text-[11px] ml-1 opacity-80 font-bold">{response.reading} {originalItem?.numericUnit}</span>}
                  </div>

                  {response.observation && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-status-fail font-bold mb-1">Observation</div>
                      <p className="text-[13px] text-text-secondary leading-relaxed font-medium">{response.observation}</p>
                    </div>
                  )}

                  {response.attachments && response.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {response.attachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-mono text-text-primary font-bold px-2 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm" title={att}>
                          <Icon name="link" className="w-3 h-3 text-text-secondary" />
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-text-secondary italic">Finding data unavailable.</div>
              )}
            </div>
          </div>

          {/* Fix evidence */}
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Fix Evidence</div>
            </div>
            <div className="p-5">
              {issue.state === 'open' || issue.state === 'in_progress' ? (
                <div className="text-[13px] text-text-secondary italic text-center py-6">
                  No fix submitted yet. Corrective action is currently active.
                </div>
              ) : (
                <div className="space-y-4 border-l-2 border-status-pass/30 pl-4 ml-1">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-status-pass font-bold mb-1">Submitted Notes</div>
                    <p className="text-[13px] text-text-primary leading-relaxed font-semibold">
                      {issue.fixNotes || <span className="italic text-text-secondary font-normal">No notes provided by assignee.</span>}
                    </p>
                  </div>
                  <div className="text-[10px] text-text-secondary font-mono">
                    Submitted {formatRelativeTime(issue.fixSubmittedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review notes */}
          {(issue.state === 'closed' || issue.state === 'reopened') && issue.reviewNotes && (
            <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
              <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
                <div className="text-[13px] font-bold text-text-primary">Review Notes</div>
              </div>
              <div className="p-5 border-l-2 border-text-secondary/15 pl-4 ml-1">
                <p className="text-[13px] text-text-primary leading-relaxed font-semibold">
                  {issue.reviewNotes}
                </p>
                <div className="mt-3 text-[10px] text-text-secondary font-mono">
                  Reviewed {formatRelativeTime(issue.verifiedAt || issue.updatedAt)}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Assignee</div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={issue.assigneeName ?? '?'} size="w-10 h-10 text-[14px]" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Assigned To</div>
                  <div className="text-[14px] font-bold text-text-primary mt-0.5">{issue.assigneeName ?? 'Unassigned'}</div>
                </div>
              </div>
              {(issue.state === 'open' || issue.state === 'in_progress') && (
                <button
                  onClick={() => setReassignModalOpen(true)}
                  className="mt-4 w-full py-2 rounded-lg border border-text-secondary/15 bg-accent-light text-text-secondary hover:bg-accent-light hover:text-text-primary text-[12px] font-bold transition-all"
                >
                  Reassign Task
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Inspection Context</div>
            </div>
            <div className="p-4 space-y-3 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary font-bold uppercase text-[10px]">Inspection</span>
                <button onClick={() => nav.push(`${prefix}/inspections/${inspection.id}`)} className="text-text-primary hover:text-primary transition-colors font-mono font-bold underline">
                  {inspection.number}
                </button>
              </div>
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-text-secondary/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Template</span>
                <span className="text-text-primary font-bold">{inspection.templateName}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-text-secondary/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Location</span>
                <span className="text-text-primary font-bold">{inspection.siteName}{inspection.area ? ` · ${inspection.area}` : ''}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-text-secondary/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Inspector</span>
                <span className="text-text-primary font-bold">{inspection.inspectorName}</span>
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerifyReopen}
              disabled={submitting || (verifyModal === 'reopen' && !verifyNote.trim())}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-bold transition-colors disabled:opacity-50 ${ verifyModal === 'verify' ? 'bg-status-pass hover:bg-status-pass/90' : 'bg-status-fail hover:bg-status-fail/90' }`}
            >
              {submitting
                ? 'Saving…'
                : verifyModal === 'verify' ? 'Close issue' : 'Reopen issue'}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="verify-note" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
            {verifyModal === 'verify' ? 'Optional note' : 'What still needs to be done?'}
          </label>
          <textarea
            id="verify-note"
            value={verifyNote}
            onChange={(e) => setVerifyNote(e.target.value)}
            placeholder={verifyModal === 'verify' ? 'Anything to note for the audit trail…' : 'Be specific so the assignee knows what to fix.'}
            rows={3}
            className="focus-ring w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-all shadow-inner resize-none"
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReassign}
              disabled={submitting || !selectedAssignee || !reassignNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[13px] font-bold transition-all hover:bg-primary disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Reassigning…' : 'Reassign'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">New Assignee</label>
            <div className="relative">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="focus-ring appearance-none w-full pl-3 pr-9 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary font-semibold transition-all cursor-pointer shadow-sm"
              >
                <option value="" disabled>Select an employee…</option>
                {employeeUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">Reason (required)</label>
            <textarea
              value={reassignNote}
              onChange={(e) => setReassignNote(e.target.value)}
              placeholder="Why is this being reassigned?"
              rows={3}
              className="focus-ring w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-all shadow-inner resize-none"
            />
          </div>
        </div>
      </Modal>

    </div>
  )
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function Stat({ label, value, tone, capitalize }: { label: string; value: string; tone?: 'green' | 'amber' | 'red'; capitalize?: boolean }) {
  const colorClass = tone === 'green' ? 'text-status-pass' : tone === 'amber' ? 'text-warning' : tone === 'red' ? 'text-status-fail' : 'text-text-primary'
  return (
    <div className="bg-white px-5 py-4 flex flex-col justify-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div className={`mt-1 text-[22px] font-bold tracking-tight ${colorClass} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function Banner({ tone, icon, label, message }: { tone: 'green' | 'amber' | 'red' | 'neutral', icon: IconName, label: string, message: string }) {
  const bg = tone === 'green' ? 'bg-status-pass/10 border-status-pass/20 text-status-pass' : 
             tone === 'amber' ? 'bg-warning/10 border-warning/20 text-warning' : 
             tone === 'red' ? 'bg-status-fail/10 border-status-fail/20 text-status-fail' : 
             'bg-accent-light border border-text-secondary/15 text-text-primary'
  return (
    <div className={`rounded-xl border ${bg} p-4 flex items-start gap-3 shadow-sm`}>
      <Icon name={icon} className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <div className="text-[13px] font-bold">{label}</div>
        <div className="mt-0.5 text-[12px] opacity-90 leading-relaxed font-medium">{message}</div>
      </div>
    </div>
  )
}

function Breadcrumb({ onBack, issueId }: { onBack: () => void, issueId?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-text-secondary font-bold">
      <button onClick={onBack} className="hover:text-text-primary transition-colors flex items-center gap-1">
        <Icon name="arrow_left" className="w-3.5 h-3.5" />
        Issues
      </button>
      {issueId && (
        <>
          <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-primary font-mono">{issueId}</span>
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

function TimelinePanel({ timeline }: { timeline: InspectionTimelineEvent[] }) {
  if (timeline.length === 0) return null
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
                <span className="font-bold">{event.byName}</span> {event.action.replace(/issue_/g, '').replace(/_/g, ' ')}
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
