import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import {
  useInspections,
  formatRelativeTime,
  flattenIssues,
  formatDate
} from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import { Avatar } from '../../../components/primitives/Avatar'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { Modal } from '../../../components/primitives/Modal'
import { PageBanner } from '../../../components/shell/PageBanner'
import type { InspectionTimelineEvent } from '../../../types/inspection'
import type { IconName } from '../../../types/role'

export function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>()
  const nav = useNav()
  const { user } = useSession()
  const { inspections, submitIssueFix } = useInspections()
  const { getById: getTemplateById } = useTemplates()

  const [fixNotes, setFixNotes] = useState('')
  const [fixAttachments, setFixAttachments] = useState<string[]>([])
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Find the issue and its parent inspection
  const flattened = useMemo(() => flattenIssues(inspections), [inspections])
  const context = flattened.find((f: any) => f.issue.id === issueId)
  
  if (!context) {
    return (
      <div className="space-y-6">
        <Breadcrumb onBack={() => nav.push(`/emp/issues`)} />
        <NotFoundCard
          title="Issue not found"
          message={`The issue ID ${issueId} doesn't exist or has been removed.`}
          backLabel="Back to home"
          onBack={() => nav.push(`/emp`)}
        />
      </div>
    )
  }

  const { issue, inspection } = context
  const template = getTemplateById(inspection.templateId)

  // Find the original item and response
  const response = inspection.responses.find((r: any) => r.itemId === issue.itemId)
  const originalItem = template?.sections.flatMap((s: any) => s.items).find((i: any) => i.id === issue.itemId)
  const originalSection = template?.sections.find((s: any) => s.items.some((i: any) => i.id === issue.itemId))
  
  // Timeline events for this issue
  const timeline = [...inspection.timeline]
    .filter((e: any) => e.target === issue.id || (e.action === 'issue_created' && e.target === issue.id) || (e.action === 'issue_created' && e.at === issue.createdAt))
    .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())

  // Banners
  const getBannerConfig = (): { tone: 'green' | 'amber' | 'red' | 'neutral', icon: IconName, label: string, message: string } | null => {
    switch (issue.state) {
      case 'in_progress':
        return { tone: 'amber', icon: 'alert', label: 'Action Required', message: 'This corrective action is assigned to you. When the work is complete, submit your fix below.' }
      case 'awaiting_verification':
        return { tone: 'neutral', icon: 'check', label: 'Fix Submitted', message: `You submitted this fix on ${formatDate(issue.fixSubmittedAt || '')}. Your manager will verify it and either close the issue or send it back with notes.` }
      case 'closed':
        return { tone: 'green', icon: 'check', label: 'Verified Closed', message: `This issue was verified closed by ${inspection.managerName} on ${formatDate(issue.verifiedAt || '')}.` }
      case 'reopened':
        return { tone: 'red', icon: 'alert', label: 'Returned for Rework', message: 'Your manager reopened this issue. See their notes below for what still needs to be done, then resubmit.' }
      default:
        return null
    }
  }
  const banner = getBannerConfig()

  const handleAddAttachment = () => {
    setFixAttachments(prev => [...prev, `photo_${Date.now()}.jpg`])
  }

  const handleRemoveAttachment = (filename: string) => {
    setFixAttachments(prev => prev.filter(a => a !== filename))
  }

  const handleSubmit = () => {
    if (!user || !fixNotes.trim() || fixAttachments.length === 0) return
    setSubmitting(true)
    setTimeout(() => {
      submitIssueFix(inspection.id, issue.id, user.email, user.name, fixNotes.trim(), fixAttachments)
      setSubmitting(false)
      setSubmitModalOpen(false)
      nav.push('/emp')
    }, 400)
  }

  const canSubmit = fixNotes.trim().length > 0 && fixAttachments.length > 0
  const isFixable = issue.state === 'in_progress' || issue.state === 'reopened'

  return (
    <div className="space-y-6">
      {/* Top row Breadcrumb and state */}
      <div className="flex items-center justify-between">
        <Breadcrumb
          onBack={() => nav.push(`/emp/issues`)}
          issueId={issue.id}
        />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-text-primary bg-accent-light px-2 py-0.5 rounded-lg border border-text-secondary/15">
            {issue.id}
          </span>
          <span className="font-mono text-[10px] font-bold text-text-primary bg-accent-light px-2 py-0.5 rounded-lg border border-text-secondary/15">
            {inspection.number}
          </span>
          <IssueStatePill state={issue.state} />
        </div>
      </div>

      {banner && (
        <Banner tone={banner.tone} icon={banner.icon} label={banner.label} message={banner.message} />
      )}

      {/* Page Banner */}
      <PageBanner
        title={issue.itemPrompt}
        subline={`Assigned corrective action generated from ${inspection.templateName} v${inspection.templateVersion}`}
        actions={
          <div className="flex items-center shrink-0">
            <IssueStatePill state={issue.state} />
          </div>
        }
      />

      {/* ============ Stat row ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-accent-light border border-text-secondary/15 rounded-2xl overflow-hidden shadow-soft">
        <Stat label="Age" value={formatRelativeTime(issue.createdAt).replace(' ago', '')} tone={Date.now() - new Date(issue.createdAt).getTime() > SEVEN_DAYS_MS && issue.state !== 'closed' ? 'red' : undefined} />
        <Stat label="State" value={issue.state.replace('_', ' ')} capitalize />
        <Stat label="Assigned By" value={inspection.managerName} />
        <Stat label="Location" value={inspection.area || inspection.siteName} />
        <Stat label="Submitted" value={issue.fixSubmittedAt ? formatRelativeTime(issue.fixSubmittedAt) : 'Not yet'} />
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
                    Failed
                    {response.reading != null && <span className="font-mono text-[11px] ml-1 opacity-80 font-bold">{response.reading} {originalItem?.numericUnit}</span>}
                  </div>

                  {response.observation && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-status-fail font-bold mb-1">Observation</div>
                      <div className="text-[13px] italic text-text-primary leading-relaxed font-semibold">"{response.observation}"</div>
                    </div>
                  )}

                  {response.attachments && response.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {response.attachments.map((att: any, i: any) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono text-text-primary font-bold px-2 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
                          <Icon name="file" className="w-3 h-3 text-text-secondary" />
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-text-secondary italic">Finding data unavailable.</div>
              )}
              
              <div className="mt-5 font-mono text-[11px] text-text-secondary font-bold">
                Raised by {inspection.inspectorName} on {formatDate(issue.createdAt)}
              </div>
            </div>
          </div>

          {/* Reopened: Manager feedback */}
          {issue.state === 'reopened' && (
            <>
              {/* Previous submission read-only */}
              <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden opacity-60 grayscale shadow-soft">
                <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
                  <div className="text-[13px] font-bold text-text-primary">Your previous submission</div>
                </div>
                <div className="p-5 border-l-2 border-status-pass/30 pl-4 ml-1">
                  <p className="text-[13px] italic text-text-secondary leading-relaxed font-medium">
                    "{issue.fixNotes}"
                  </p>
                  {issue.fixAttachments && issue.fixAttachments.length > 0 && (
                    <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                      {issue.fixAttachments.map((att: any, i: any) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-text-secondary px-2 py-0.5 rounded bg-accent-light border border-text-secondary/15">
                          <Icon name="file" className="w-3 h-3 text-text-secondary" />
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Manager Feedback */}
              <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
                <div className="px-5 py-4 border-b border-text-secondary/15 bg-status-fail/5">
                  <div className="text-[13px] font-bold text-text-primary flex items-center gap-2">
                    <Icon name="alert" className="w-4 h-4 text-status-fail animate-pulse" />
                    Manager's Feedback
                  </div>
                </div>
                <div className="p-5 border-l-2 border-status-fail pl-4 ml-1">
                  <p className="text-[13px] text-text-primary font-semibold leading-relaxed">
                    {issue.reviewNotes}
                  </p>
                  <div className="mt-3 font-mono text-[10px] text-text-secondary font-bold">
                    Returned by {inspection.managerName} on {formatDate(issue.updatedAt)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Surface */}
          {isFixable ? (
            <div className="rounded-2xl border border-text-secondary/15 shadow-soft bg-white overflow-hidden">
              <div className="px-6 py-5 border-b border-text-secondary/15 bg-accent-light/50">
                <h2 className="text-[16px] font-bold text-text-primary">Submit your fix</h2>
                <p className="mt-0.5 text-[13px] text-text-secondary leading-normal font-medium">Describe what you did and attach photo evidence.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-text-primary mb-1">
                    What did you do? <span className="text-status-fail">*</span>
                  </label>
                  <p className="text-[12px] text-text-secondary mb-3 font-medium">
                    Be specific. Explain what you found, what you changed, and how you verified the fix.
                  </p>
                  <textarea
                    value={fixNotes}
                    onChange={(e) => setFixNotes(e.target.value)}
                    rows={5}
                    placeholder="e.g. Re-cleaned the filler head with caustic, rinsed, and performed an ATP swab which returned 8 RLU."
                    className="focus-ring w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary transition-all shadow-inner resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-text-primary mb-1">
                    Photo evidence <span className="text-status-fail">*</span>
                  </label>
                  <p className="text-[12px] text-text-secondary mb-3 font-medium">
                    At least one photo is required. Show the corrected state.
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={handleAddAttachment}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-text-secondary/15 bg-white hover:bg-accent-light text-[12px] font-bold text-text-primary transition-colors shadow-sm"
                    >
                      <Icon name="eye" className="w-3.5 h-3.5" /> Take photo
                    </button>
                    <button 
                      onClick={handleAddAttachment}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-text-secondary/15 bg-white hover:bg-accent-light text-[12px] font-bold text-text-primary transition-colors shadow-sm"
                    >
                      <Icon name="file" className="w-3.5 h-3.5" /> Attach file
                    </button>
                  </div>

                  {fixAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fixAttachments.map(att => (
                        <div key={att} className="inline-flex items-center gap-1.5 text-[10px] font-mono text-text-primary font-bold px-2 py-1 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
                          <Icon name="file" className="w-3.5 h-3.5 text-text-secondary" />
                          {att}
                          <button onClick={() => handleRemoveAttachment(att)} className="ml-1 hover:text-status-fail transition-colors">
                            <Icon name="close" className="w-3 h-3 text-text-secondary" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-text-secondary/15">
                  <button
                    onClick={() => setSubmitModalOpen(true)}
                    disabled={!canSubmit}
                    className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-warning text-text-primary text-[14px] font-bold transition-all hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Submit fix for review
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Read-only submitted state */}
              <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
                <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
                  <div className="text-[13px] font-bold text-text-primary">
                    {issue.state === 'awaiting_verification' ? 'Your submitted fix' : 'Fix evidence'}
                  </div>
                </div>
                <div className="p-5">
                  <div className="space-y-4 border-l-2 border-status-pass/30 pl-4 ml-1">
                    <p className="text-[13px] text-text-primary leading-relaxed font-semibold">
                      "{issue.fixNotes}"
                    </p>
                    
                    {issue.fixAttachments && issue.fixAttachments.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {issue.fixAttachments.map((att: any, i: any) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono text-text-primary font-bold px-2 py-0.5 rounded bg-accent-light border border-text-secondary/15 shadow-sm">
                            <Icon name="file" className="w-3 h-3 text-text-secondary" />
                            {att}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 font-mono text-[10px] text-text-secondary font-bold">
                      Submitted on {formatDate(issue.fixSubmittedAt || issue.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager's review (if closed) */}
              {issue.state === 'closed' && (
                <>
                  <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
                    <div className="px-5 py-4 border-b border-text-secondary/15 bg-status-pass/5">
                      <div className="text-[13px] font-bold text-text-primary flex items-center gap-2">
                        <Icon name="check" className="w-4 h-4 text-status-pass" />
                        Manager's Review
                      </div>
                    </div>
                    <div className="p-5 border-l-2 border-status-pass pl-4 ml-1">
                      {issue.reviewNotes ? (
                        <p className="text-[13px] text-text-primary font-semibold leading-relaxed">
                          {issue.reviewNotes}
                        </p>
                      ) : (
                        <p className="text-[13px] italic text-text-secondary font-medium">Verified and closed without notes.</p>
                      )}
                      <div className="mt-3 font-mono text-[10px] text-text-secondary font-bold">
                        Manager verified on {formatDate(issue.verifiedAt || issue.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => nav.push('/emp')}
                      className="w-full inline-flex justify-center items-center px-4 py-3 rounded-lg border border-text-secondary/15 bg-white text-[14px] font-bold text-text-primary hover:bg-accent-light transition-colors shadow-sm"
                    >
                      View next action
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Assigned by</div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={inspection.managerName} size="w-10 h-10 text-[14px]" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Manager</div>
                  <div className="text-[14px] font-bold text-text-primary mt-0.5">{inspection.managerName}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-text-secondary/15 bg-white overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-text-secondary/15 bg-accent-light/50">
              <div className="text-[13px] font-bold text-text-primary">Inspection Context</div>
            </div>
            <div className="p-4 space-y-3 text-[12px]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Inspection</span>
                <span className="text-text-primary font-mono font-bold">{inspection.number}</span>
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

      {/* Submit Confirmation Modal */}
      <Modal
        open={submitModalOpen}
        onClose={() => {
          if (submitting) return
          setSubmitModalOpen(false)
        }}
        title="Submit this fix?"
        description={`Your manager ${inspection.managerName} will be notified and will verify the fix. You'll be notified when they accept or send it back.`}
        size="sm"
        dismissOnBackdrop={!submitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSubmitModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-bold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-pass text-white text-[13px] font-bold hover:bg-status-pass/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <div className="hidden" />
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
      <span className="text-text-secondary font-bold uppercase text-[10px]">Employee</span>
      <Icon name="chevron_right" className="w-3.5 h-3.5 text-text-secondary" />
      <button onClick={onBack} className="hover:text-text-primary transition-colors flex items-center gap-1">
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
