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
      <div className="stagger max-w-[1400px] mx-auto px-6 py-8">
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
        return { tone: 'amber', icon: 'alert', label: 'Action required', message: 'This corrective action is assigned to you. When the work is complete, submit your fix below.' }
      case 'awaiting_verification':
        return { tone: 'neutral', icon: 'check', label: 'Submitted', message: `You submitted this fix on ${formatDate(issue.fixSubmittedAt || '')}. Your manager will verify it and either close the issue or send it back with notes.` }
      case 'closed':
        return { tone: 'green', icon: 'layers', label: 'Verified closed', message: `This issue was verified closed by ${inspection.managerName} on ${formatDate(issue.verifiedAt || '')}.` }
      case 'reopened':
        return { tone: 'red', icon: 'alert', label: 'Returned for rework', message: 'Your manager reopened this issue. See their notes below for what still needs to be done, then resubmit.' }
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
    <div className="stagger max-w-[1200px] mx-auto px-6 py-8">
      <Breadcrumb
        onBack={() => nav.push(`/emp/issues`)}
        issueId={issue.id}
      />

      {banner && (
        <Banner tone={banner.tone} icon={banner.icon} label={banner.label} message={banner.message} />
      )}

      {/* ============ Hero ============ */}
      <div className="mt-6 flex items-start justify-between flex-wrap gap-6">
        <div className="min-w-0 max-w-[800px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-ink-700 dark:text-ink-200 px-2 py-0.5 rounded border hairline">
              {issue.id}
            </span>
            <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">
              {inspection.number}
            </span>
            <span className="font-mono text-[11px] text-ink-500 dark:text-ink-400">
              {inspection.templateName} v{inspection.templateVersion}
            </span>
            <IssueStatePill state={issue.state} />
          </div>
          <h1 className="mt-4 font-display text-[32px] leading-[1.1] tracking-tight text-ink-900 dark:text-ink-50">
            {issue.itemPrompt}
          </h1>
        </div>
      </div>

      {/* ============ Stat row ============ */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-px bg-ink-200/60 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
        <Stat label="Age" value={formatRelativeTime(issue.createdAt).replace(' ago', '')} tone={Date.now() - new Date(issue.createdAt).getTime() > SEVEN_DAYS_MS && issue.state !== 'closed' ? 'red' : undefined} />
        <Stat label="State" value={issue.state.replace('_', ' ')} capitalize />
        <Stat label="Assigned by" value={inspection.managerName} />
        <Stat label="Location" value={inspection.area || inspection.siteName} />
        <Stat label="Submitted" value={issue.fixSubmittedAt ? formatRelativeTime(issue.fixSubmittedAt) : 'Not yet'} />
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
                    Failed
                    {response.reading != null && <span className="font-mono text-[11px] ml-1 opacity-80">{response.reading} {originalItem?.numericUnit}</span>}
                  </div>

                  {response.observation && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-signal-red/80 font-medium mb-1">Observation</div>
                      <div className="text-[13px] italic text-ink-700 dark:text-ink-200 leading-relaxed">"{response.observation}"</div>
                    </div>
                  )}

                  {response.attachments && response.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {response.attachments.map((att: any, i: any) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 border hairline">
                          <Icon name="file" className="w-3 h-3" />
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-ink-500 italic">Finding data unavailable.</div>
              )}
              
              <div className="mt-5 font-mono text-[11px] text-ink-400 dark:text-ink-500">
                Raised by {inspection.inspectorName} on {formatDate(issue.createdAt)}
              </div>
            </div>
          </div>

          {/* Reopened: Manager feedback */}
          {issue.state === 'reopened' && (
            <>
              {/* Previous submission read-only */}
              <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden opacity-60 grayscale">
                <div className="px-5 py-4 border-b hairline">
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Your previous submission</div>
                </div>
                <div className="p-5 border-l-2 border-signal-green/40 pl-4 ml-1">
                  <p className="text-[13px] italic text-ink-700 dark:text-ink-200 leading-relaxed">
                    "{issue.fixNotes}"
                  </p>
                  {issue.fixAttachments && issue.fixAttachments.length > 0 && (
                    <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                      {issue.fixAttachments.map((att: any, i: any) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 border hairline">
                          <Icon name="file" className="w-3 h-3" />
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Manager Feedback */}
              <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
                <div className="px-5 py-4 border-b hairline bg-signal-red/5">
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 flex items-center gap-2">
                    <Icon name="alert" className="w-4 h-4 text-signal-red" />
                    Manager's feedback
                  </div>
                </div>
                <div className="p-5 border-l-2 border-signal-red pl-4 ml-1">
                  <p className="text-[13px] text-ink-700 dark:text-ink-200 leading-relaxed">
                    {issue.reviewNotes}
                  </p>
                  <div className="mt-3 font-mono text-[11px] text-ink-400 dark:text-ink-500">
                    Returned by {inspection.managerName} on {formatDate(issue.updatedAt)}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Surface */}
          {isFixable ? (
            <div className="rounded-xl border hairline border-ink-300 dark:border-ink-600 shadow-sm bg-white dark:bg-ink-900 overflow-hidden">
              <div className="px-6 py-5 border-b hairline bg-ink-50/50 dark:bg-ink-800/20">
                <h2 className="font-display text-[20px] text-ink-900 dark:text-ink-50">Submit your fix</h2>
                <p className="mt-1 text-[13px] italic text-ink-600 dark:text-ink-300">Describe what you did and attach photo evidence.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-ink-900 dark:text-ink-50 mb-1">
                    What did you do? <span className="text-signal-red">*</span>
                  </label>
                  <p className="text-[12px] text-ink-500 dark:text-ink-400 mb-3">
                    Be specific. Explain what you found, what you changed, and how you verified the fix.
                  </p>
                  <textarea
                    value={fixNotes}
                    onChange={(e) => setFixNotes(e.target.value)}
                    rows={5}
                    placeholder="e.g. Re-cleaned the filler head with caustic, rinsed, and performed an ATP swab which returned 8 RLU."
                    className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-ink-900 dark:text-ink-50 mb-1">
                    Photo evidence <span className="text-signal-red">*</span>
                  </label>
                  <p className="text-[12px] text-ink-500 dark:text-ink-400 mb-3">
                    At least one photo is required. Show the corrected state.
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <button 
                      onClick={handleAddAttachment}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      <Icon name="eye" className="w-3.5 h-3.5" /> Take photo
                    </button>
                    <button 
                      onClick={handleAddAttachment}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      <Icon name="file" className="w-3.5 h-3.5" /> Attach file
                    </button>
                  </div>

                  {fixAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fixAttachments.map(att => (
                        <div key={att} className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-1 rounded bg-ink-100 dark:bg-ink-800 border hairline">
                          <Icon name="file" className="w-3 h-3" />
                          {att}
                          <button onClick={() => handleRemoveAttachment(att)} className="ml-1 hover:text-signal-red transition-colors">
                            <Icon name="close" className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t hairline">
                  <button
                    onClick={() => setSubmitModalOpen(true)}
                    disabled={!canSubmit}
                    className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-md bg-signal-green text-white text-[14px] font-medium transition-colors hover:bg-signal-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit fix for review
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Read-only submitted state */}
              <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
                <div className="px-5 py-4 border-b hairline">
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">
                    {issue.state === 'awaiting_verification' ? 'Your submitted fix' : 'Fix evidence'}
                  </div>
                </div>
                <div className="p-5">
                  <div className="space-y-4 border-l-2 border-signal-green/40 pl-4 ml-1">
                    <p className="text-[13px] italic text-ink-700 dark:text-ink-200 leading-relaxed">
                      "{issue.fixNotes}"
                    </p>
                    
                    {issue.fixAttachments && issue.fixAttachments.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {issue.fixAttachments.map((att: any, i: any) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-600 dark:text-ink-300 px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 border hairline">
                            <Icon name="file" className="w-3 h-3" />
                            {att}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 font-mono text-[11px] text-ink-400 dark:text-ink-500">
                      Submitted on {formatDate(issue.fixSubmittedAt || issue.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager's review (if closed) */}
              {issue.state === 'closed' && (
                <>
                  <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
                    <div className="px-5 py-4 border-b hairline bg-signal-green/5">
                      <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 flex items-center gap-2">
                        <Icon name="check" className="w-4 h-4 text-signal-green" />
                        Manager's review
                      </div>
                    </div>
                    <div className="p-5 border-l-2 border-signal-green pl-4 ml-1">
                      {issue.reviewNotes ? (
                        <p className="text-[13px] text-ink-700 dark:text-ink-200 leading-relaxed">
                          {issue.reviewNotes}
                        </p>
                      ) : (
                        <p className="text-[13px] italic text-ink-500 dark:text-ink-400">Verified and closed without notes.</p>
                      )}
                      <div className="mt-3 font-mono text-[11px] text-ink-400 dark:text-ink-500">
                        Manager verified on {formatDate(issue.verifiedAt || issue.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => nav.push('/emp')}
                      className="w-full inline-flex justify-center items-center px-4 py-3 rounded-md border hairline bg-white dark:bg-ink-900 text-[14px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
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
          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Assigned by</div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={inspection.managerName} size="w-10 h-10 text-[14px]" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Manager</div>
                  <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 mt-0.5">{inspection.managerName}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
            <div className="px-5 py-4 border-b hairline">
              <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">Inspection Context</div>
            </div>
            <div className="p-4 space-y-3 text-[13px]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Inspection</span>
                <span className="text-ink-900 dark:text-ink-50 font-mono font-medium">{inspection.number}</span>
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
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-signal-green text-white text-[13px] font-medium hover:bg-signal-green/90 transition-colors disabled:opacity-50"
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
      <span className="text-ink-400">Employee</span>
      <Icon name="chevron_right" className="w-3 h-3" />
      <button onClick={onBack} className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors flex items-center gap-1">
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
