import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, flattenIssues, formatRelativeTime } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { Avatar } from '../../../components/primitives/Avatar'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { Modal } from '../../../components/primitives/Modal'
import type { InspectionIssue, Inspection, InspectionDomain } from '../../../types/inspection'
import { PageBanner } from '../../../components/shell/PageBanner'

type SortKey = 'newest' | 'oldest' | 'aging' | 'assignee'
type StatusGroup = 'all' | 'open' | 'awaiting' | 'closed'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function IssuesListPage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/sm' : '/qm'
  const { user } = useSession()
  const { inspections, verifyIssue, reopenIssue } = useInspections()

  const [query, setQuery] = useState('')
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('open')
  const [siteFilter, setSiteFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  // Modals state
  const [verifyModalTarget, setVerifyModalTarget] = useState<{ inspectionId: string; issueId: string } | null>(null)
  const [reopenModalTarget, setReopenModalTarget] = useState<{ inspectionId: string; issueId: string } | null>(null)
  const [modalNote, setModalNote] = useState('')

  const flattened = useMemo(() => flattenIssues(inspections.filter(i => i.domain === domain)), [inspections, domain])

  // Filters setup
  const sites = useMemo(() => {
    const m = new Map<string, string>()
    flattened.forEach(({ inspection }) => m.set(inspection.siteId, inspection.siteName))
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }))
  }, [flattened])

  const assignees = useMemo(() => {
    const m = new Map<string, string>()
    flattened.forEach(({ issue }) => {
      if (issue.assigneeId && issue.assigneeName) m.set(issue.assigneeId, issue.assigneeName)
    })
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }))
  }, [flattened])

  // KPIs
  const kpis = useMemo(() => {
    let openCount = 0
    let awaitingCount = 0
    let agingCount = 0
    let closedThisWeek = 0
    const now = Date.now()

    flattened.forEach(({ issue }) => {
      if (issue.state === 'open' || issue.state === 'in_progress') openCount++
      if (issue.state === 'awaiting_verification') awaitingCount++
      
      if (issue.state !== 'closed') {
        const age = now - new Date(issue.createdAt).getTime()
        if (age > SEVEN_DAYS_MS) agingCount++
      }

      if (issue.state === 'closed' && issue.verifiedAt) {
        const verifiedAge = now - new Date(issue.verifiedAt).getTime()
        if (verifiedAge <= SEVEN_DAYS_MS) closedThisWeek++
      }
    })

    return { openCount, awaitingCount, agingCount, closedThisWeek }
  }, [flattened])

  // Group matching logic
  const matchesGroup = (issue: InspectionIssue, group: StatusGroup) => {
    switch (group) {
      case 'all': return true
      case 'open': return issue.state === 'open' || issue.state === 'in_progress' || issue.state === 'reopened'
      case 'awaiting': return issue.state === 'awaiting_verification'
      case 'closed': return issue.state === 'closed'
    }
  }

  const groupCounts = useMemo(() => {
    const obj: Record<StatusGroup, number> = { all: 0, open: 0, awaiting: 0, closed: 0 }
    flattened.forEach(({ issue }) => {
      if (matchesGroup(issue, 'all')) obj.all++
      if (matchesGroup(issue, 'open')) obj.open++
      if (matchesGroup(issue, 'awaiting')) obj.awaiting++
      if (matchesGroup(issue, 'closed')) obj.closed++
    })
    return obj
  }, [flattened])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matchesQuery = ({ issue, inspection }: { issue: InspectionIssue; inspection: Inspection }) =>
      !q ||
      issue.id.toLowerCase().includes(q) ||
      issue.itemPrompt.toLowerCase().includes(q) ||
      inspection.number.toLowerCase().includes(q) ||
      inspection.siteName.toLowerCase().includes(q) ||
      (issue.assigneeName ?? '').toLowerCase().includes(q)

    const matchesSite = ({ inspection }: { inspection: Inspection }) => siteFilter === 'all' || inspection.siteId === siteFilter
    
    const matchesAssignee = ({ issue }: { issue: InspectionIssue }) => {
      if (assigneeFilter === 'all') return true
      if (assigneeFilter === 'unassigned') return issue.assigneeId === null
      return issue.assigneeId === assigneeFilter
    }

    const result = flattened.filter(
      (item) => matchesQuery(item) && matchesGroup(item.issue, statusGroup) && matchesSite(item) && matchesAssignee(item)
    )

    result.sort((a, b) => {
      switch (sortKey) {
        case 'newest': return new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime()
        case 'oldest': return new Date(a.issue.createdAt).getTime() - new Date(b.issue.createdAt).getTime()
        case 'aging': {
          // Oldest in-flight first. If both are closed, put them at the bottom.
          if (a.issue.state === 'closed' && b.issue.state !== 'closed') return 1
          if (a.issue.state !== 'closed' && b.issue.state === 'closed') return -1
          return new Date(a.issue.createdAt).getTime() - new Date(b.issue.createdAt).getTime()
        }
        case 'assignee': return (a.issue.assigneeName ?? '').localeCompare(b.issue.assigneeName ?? '')
      }
    })
    return result
  }, [flattened, query, statusGroup, siteFilter, assigneeFilter, sortKey])

  // Modals logic
  const handleVerify = () => {
    if (!verifyModalTarget || !user) return
    verifyIssue(verifyModalTarget.inspectionId, verifyModalTarget.issueId, user.email, user.name, modalNote)
    setVerifyModalTarget(null)
    setModalNote('')
  }

  const handleReopen = () => {
    if (!reopenModalTarget || !user || !modalNote.trim()) return
    reopenIssue(reopenModalTarget.inspectionId, reopenModalTarget.issueId, user.email, user.name, modalNote)
    setReopenModalTarget(null)
    setModalNote('')
  }

  return (
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <PageBanner
        title="Corrective actions"
        subline={`${groupCounts.all} open across all states · ${groupCounts.awaiting} awaiting verification`}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition">
              <Icon name="download" className="w-3.5 h-3.5" />
              Export
            </button>
          </>
        }
      />

      {/* ============ KPI Strip ============ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-5 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
          <div className="pl-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">Open issues</div>
            <div className="font-mono text-[36px] font-bold text-text-primary leading-none">{kpis.openCount}</div>
          </div>
        </div>
        <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-5 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" aria-hidden="true" />
          <div className="pl-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">Awaiting verification</div>
            <div className="font-mono text-[36px] font-bold text-text-primary leading-none">{kpis.awaitingCount}</div>
          </div>
        </div>
        <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-5 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-status-fail" aria-hidden="true" />
          <div className="pl-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">Aging &gt; 7 days</div>
            <div className="font-mono text-[36px] font-bold text-text-primary leading-none">{kpis.agingCount}</div>
          </div>
        </div>
        <div className="relative rounded-2xl bg-white shadow-soft border border-text-secondary/10 p-5 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-status-pass" aria-hidden="true" />
          <div className="pl-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">Closed this week</div>
            <div className="font-mono text-[36px] font-bold text-text-primary leading-none">{kpis.closedThisWeek}</div>
          </div>
        </div>
      </div>

      {/* ============ Filter bar ============ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-accent-light rounded-xl">
          {(['all', 'open', 'awaiting', 'closed'] as const).map((key) => {
            const labels = { all: 'All', open: 'Open', awaiting: 'Awaiting verification', closed: 'Closed' }
            return (
              <button
                key={key}
                onClick={() => setStatusGroup(key)}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition ${ statusGroup === key ? 'bg-white text-text-primary shadow-soft' : 'text-text-secondary hover:text-text-primary' }`}
              >
                {labels[key]}
                {groupCounts[key] > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ statusGroup === key ? 'bg-primary/10 text-primary' : 'bg-accent-light text-text-secondary' }`}>
                    {groupCounts[key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issues…"
              className="w-full bg-white border border-text-secondary/15 rounded-lg pl-10 pr-8 py-2 text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                <Icon name="close" className="w-3 h-3" />
              </button>
            )}
          </div>

          <FilterSelect value={siteFilter} onChange={setSiteFilter} options={[{ value: 'all', label: 'All sites' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]} />
          <FilterSelect value={assigneeFilter} onChange={setAssigneeFilter} options={[{ value: 'all', label: 'All assignees' }, { value: 'unassigned', label: 'Unassigned' }, ...assignees.map((i) => ({ value: i.id, label: i.name }))]} />
          <FilterSelect value={sortKey} onChange={(v) => setSortKey(v as SortKey)} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'aging', label: 'Aging (oldest in-flight)' }, { value: 'assignee', label: 'Assignee' }]} />
        </div>
      </div>

      {/* ============ Table ============ */}
      <div className="rounded-2xl bg-white shadow-soft border border-text-secondary/15 overflow-hidden">
        <div className="grid grid-cols-[100px_2.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-4 px-6 py-4 bg-accent-light border-b border-text-secondary/15 items-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Issue</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Prompt + context</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Assignee</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Age</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Last update</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary text-right">State</div>
        </div>

        {flattened.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-[14px] font-semibold text-text-primary">No results match these filters</div>
            <button onClick={() => { setQuery(''); setStatusGroup('all'); setSiteFilter('all'); setAssigneeFilter('all') }} className="mt-2 text-[13px] text-primary hover:text-primary transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-text-secondary/15">
            {filtered.map(({ issue, inspection }) => {
              const ageMs = Date.now() - new Date(issue.createdAt).getTime()
              const isAging = ageMs > SEVEN_DAYS_MS && issue.state !== 'closed'
              
              return (
                <button
                  key={issue.id}
                  onClick={() => nav.push(`${prefix}/issues/${issue.id}`)}
                  className="w-full grid grid-cols-[100px_2.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-4 items-center px-6 py-4 text-left hover:bg-accent-light transition group"
                >
                  {/* Issue ID */}
                  <div className="font-mono text-[13px] text-text-secondary">{issue.id}</div>
                  
                  {/* Prompt + context */}
                  <div className="min-w-0 pr-4">
                    <div className="text-[14px] font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{issue.itemPrompt}</div>
                    <div className="text-[12px] text-text-secondary mt-0.5 truncate">
                      {inspection.number} · {inspection.templateName} · {inspection.area || inspection.siteName}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center gap-2 min-w-0">
                    {issue.assigneeName ? (
                      <>
                        <Avatar name={issue.assigneeName} size="w-6 h-6 text-[9px]" />
                        <span className="text-[13px] text-text-secondary truncate">{issue.assigneeName}</span>
                      </>
                    ) : (
                      <span className="text-[13px] text-text-secondary italic">Unassigned</span>
                    )}
                  </div>

                  {/* Age */}
                  <div className={`text-[13px] font-mono ${isAging ? 'text-status-fail font-semibold' : 'text-text-secondary'}`}>
                    {formatRelativeTime(issue.createdAt).replace(' ago', '')}
                  </div>

                  {/* Last update */}
                  <div className="text-[13px] font-mono text-text-secondary">
                    {formatRelativeTime(issue.updatedAt)}
                  </div>

                  {/* State & Inline Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {issue.state === 'awaiting_verification' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setVerifyModalTarget({ inspectionId: inspection.id, issueId: issue.id }) }}
                          className="px-2 py-1 rounded bg-status-pass text-white text-[11px] font-mono font-medium hover:bg-status-pass/90 transition-colors"
                        >
                          Verify
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setReopenModalTarget({ inspectionId: inspection.id, issueId: issue.id }) }}
                          className="px-2 py-1 rounded border border-status-fail text-status-fail text-[11px] font-mono font-medium hover:bg-status-fail/5 transition-colors"
                        >
                          Reopen
                        </button>
                      </div>
                    )}
                    <IssueStatePill state={issue.state} />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-text-secondary/15 flex items-center justify-between text-[12px] text-text-secondary bg-accent-light/50">
            <span>Showing <span className="font-mono font-semibold text-text-primary">{filtered.length}</span> of {flattened.length}</span>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      <Modal
        open={!!verifyModalTarget}
        onClose={() => { setVerifyModalTarget(null); setModalNote('') }}
        title="Verify issue closed"
        description="This acknowledges that the corrective action has been completed satisfactorily. This will close the issue."
        size="md"
        footer={
          <>
            <button onClick={() => { setVerifyModalTarget(null); setModalNote('') }} className="px-4 py-2 rounded-lg border border-text-secondary/15 text-[13px] font-semibold text-text-secondary hover:bg-accent-light transition">Cancel</button>
            <button onClick={handleVerify} className="px-4 py-2 rounded-lg bg-status-pass text-white text-[13px] font-semibold hover:bg-status-pass/90 transition">Verify & Close</button>
          </>
        }
      >
        <label className="block text-[12px] font-bold uppercase tracking-wide text-text-secondary mb-2">Review note (optional)</label>
        <textarea
          value={modalNote}
          onChange={(e) => setModalNote(e.target.value)}
          placeholder="e.g. Looks good, photo evidence confirms the fix."
          rows={3}
          className="input-base w-full focus-ring resize-none"
        />
      </Modal>

      {/* Reopen Modal */}
      <Modal
        open={!!reopenModalTarget}
        onClose={() => { setReopenModalTarget(null); setModalNote('') }}
        title="Reopen issue"
        description="This will send the issue back to the assignee for further work."
        size="md"
        footer={
          <>
            <button onClick={() => { setReopenModalTarget(null); setModalNote('') }} className="px-4 py-2 rounded-lg border border-text-secondary/15 text-[13px] font-semibold text-text-secondary hover:bg-accent-light transition">Cancel</button>
            <button onClick={handleReopen} disabled={!modalNote.trim()} className="px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-semibold hover:bg-status-fail/90 disabled:opacity-50 transition">Reopen issue</button>
          </>
        }
      >
        <label className="block text-[12px] font-bold uppercase tracking-wide text-text-secondary mb-2">Reason (required)</label>
        <textarea
          value={modalNote}
          onChange={(e) => setModalNote(e.target.value)}
          placeholder="Why is this being reopened?"
          rows={3}
          className="input-base w-full focus-ring resize-none"
        />
      </Modal>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-light mb-4">
        <Icon name="check" className="w-6 h-6 text-text-secondary" />
      </div>
      <div className="text-[15px] font-semibold text-text-primary mb-1">
        No corrective actions active
      </div>
      <div className="text-[13px] text-text-secondary max-w-[360px] mx-auto">
        When an inspector flags a failed checklist item, a corrective action will automatically populate here.
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )
}
