import { useMemo, useState } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, flattenIssues, formatRelativeTime } from '../../../lib/inspections'
import { Icon } from '../../../components/primitives/Icon'
import { Avatar } from '../../../components/primitives/Avatar'
import { IssueStatePill } from '../../../components/primitives/IssueStatePill'
import { Modal } from '../../../components/primitives/Modal'
import type { InspectionIssue, Inspection, InspectionDomain } from '../../../types/inspection'

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
    <div className="stagger max-w-[1400px] mx-auto px-6 py-8">
      {/* ============ Header ============ */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-500 dark:text-ink-400">
            <span>{domain === 'safety' ? 'Safety Manager' : 'Quality Manager'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Issues</span>
          </div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] tracking-tight text-ink-900 dark:text-ink-50">
            Corrective <span className="italic text-ink-500 dark:text-ink-400">actions</span>.
          </h1>
          <p className="mt-1 text-[14px] text-ink-600 dark:text-ink-300">
            {groupCounts.all} open across all states · {groupCounts.awaiting} awaiting verification
            {kpis.agingCount > 0 && <span className="text-signal-red ml-1">· {kpis.agingCount} aging &gt; 7 days</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            <Icon name="download" className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
            View audit log
          </button>
        </div>
      </div>

      {/* ============ KPI Strip ============ */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200 dark:bg-ink-800 border hairline rounded-xl overflow-hidden">
        <KpiCell label="Open issues" value={kpis.openCount} highlight={kpis.openCount > 0 ? 'amber' : undefined} />
        <KpiCell label="Awaiting verification" value={kpis.awaitingCount} highlight={kpis.awaitingCount > 0 ? 'green' : undefined} />
        <div className="bg-white dark:bg-ink-950 p-5 flex flex-col justify-center min-h-[96px]">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Aging &gt; 7 days</div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`font-mono text-[24px] ${kpis.agingCount > 0 ? 'text-signal-red' : 'text-ink-900 dark:text-ink-50'}`}>{kpis.agingCount}</span>
            {kpis.agingCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-signal-red animate-pulse-dot" />}
          </div>
        </div>
        <KpiCell label="Closed this week" value={kpis.closedThisWeek} />
      </div>

      {/* ============ Filter bar ============ */}
      <div className="mt-8 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-md border hairline bg-white dark:bg-ink-900">
          {(['all', 'open', 'awaiting', 'closed'] as const).map((key) => {
            const labels = { all: 'All', open: 'Open', awaiting: 'Awaiting me', closed: 'Closed' }
            return (
              <button
                key={key}
                onClick={() => setStatusGroup(key)}
                className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors flex items-center gap-2 ${
                  statusGroup === key
                    ? 'bg-accent-500/10 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 border border-accent-500/20'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {labels[key]}
                <span className="text-[10px] font-mono text-ink-400 dark:text-ink-500">{groupCounts[key]}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-w-[200px] max-w-[360px] flex items-center gap-2 px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-900 focus-within:border-accent-500">
          <Icon name="search" className="w-3.5 h-3.5 text-ink-400 dark:text-ink-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues…"
            className="flex-1 bg-transparent text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-50 transition-colors">
              <Icon name="close" className="w-3 h-3" />
            </button>
          )}
        </div>

        <FilterSelect value={siteFilter} onChange={setSiteFilter} options={[{ value: 'all', label: 'All sites' }, ...sites.map((s) => ({ value: s.id, label: s.name }))]} />
        <FilterSelect value={assigneeFilter} onChange={setAssigneeFilter} options={[{ value: 'all', label: 'All assignees' }, { value: 'unassigned', label: 'Unassigned' }, ...assignees.map((i) => ({ value: i.id, label: i.name }))]} />
        <FilterSelect value={sortKey} onChange={(v) => setSortKey(v as SortKey)} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'aging', label: 'Aging (oldest in-flight)' }, { value: 'assignee', label: 'Assignee' }]} />
      </div>

      {/* ============ Table ============ */}
      <div className="mt-6 rounded-xl border hairline bg-white dark:bg-ink-900 overflow-hidden">
        <div className="grid grid-cols-[100px_2.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-4 px-5 py-2.5 border-b hairline bg-ink-50/50 dark:bg-ink-950/50 items-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Issue</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Prompt + context</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Assignee</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Age</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">Last update</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 text-right">State</div>
        </div>

        {flattened.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border hairline border-dashed">
              <Icon name="check" className="w-5 h-5 text-signal-green" />
            </div>
            <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">No issues raised.</div>
            <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400 max-w-[360px] mx-auto">
              Issues appear here when an inspector flags a failed item.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mt-4 text-[15px] font-medium text-ink-900 dark:text-ink-50">No results match these filters</div>
            <button onClick={() => { setQuery(''); setStatusGroup('all'); setSiteFilter('all'); setAssigneeFilter('all') }} className="mt-2 text-[13px] text-accent-500 hover:text-accent-600 transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y hairline">
            {filtered.map(({ issue, inspection }) => {
              const ageMs = Date.now() - new Date(issue.createdAt).getTime()
              const isAging = ageMs > SEVEN_DAYS_MS && issue.state !== 'closed'
              
              return (
                <button
                  key={issue.id}
                  onClick={() => nav.push(`${prefix}/issues/${issue.id}`)}
                  className="w-full grid grid-cols-[100px_2.2fr_1fr_0.8fr_0.9fr_0.9fr] gap-4 items-center px-5 py-3.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors group"
                >
                  {/* Issue ID */}
                  <div className="font-mono text-[11px] text-ink-600 dark:text-ink-300">{issue.id}</div>
                  
                  {/* Prompt + context */}
                  <div className="min-w-0 pr-4">
                    <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{issue.itemPrompt}</div>
                    <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                      {inspection.number} · {inspection.templateName} · {inspection.area || inspection.siteName}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center gap-2 min-w-0">
                    {issue.assigneeName ? (
                      <>
                        <Avatar name={issue.assigneeName} size="w-6 h-6 text-[9px]" />
                        <span className="text-[12px] text-ink-700 dark:text-ink-200 truncate">{issue.assigneeName}</span>
                      </>
                    ) : (
                      <span className="text-[12px] text-ink-500 dark:text-ink-400 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Age */}
                  <div className={`text-[12px] font-mono ${isAging ? 'text-signal-red font-medium' : 'text-ink-600 dark:text-ink-300'}`}>
                    {formatRelativeTime(issue.createdAt).replace(' ago', '')}
                  </div>

                  {/* Last update */}
                  <div className="text-[12px] font-mono text-ink-600 dark:text-ink-300">
                    {formatRelativeTime(issue.updatedAt)}
                  </div>

                  {/* State & Inline Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {issue.state === 'awaiting_verification' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setVerifyModalTarget({ inspectionId: inspection.id, issueId: issue.id }) }}
                          className="px-2 py-1 rounded bg-signal-green text-white text-[11px] font-mono font-medium hover:bg-signal-green/90 transition-colors"
                        >
                          Verify
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setReopenModalTarget({ inspectionId: inspection.id, issueId: issue.id }) }}
                          className="px-2 py-1 rounded border border-signal-red text-signal-red text-[11px] font-mono font-medium hover:bg-signal-red/5 transition-colors"
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
          <div className="px-5 py-3 border-t hairline flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-400">
            <span>Showing <span className="font-mono text-ink-900 dark:text-ink-50">{filtered.length}</span> of {flattened.length}</span>
            <button className="hover:text-ink-900 dark:hover:text-ink-50 transition-colors">View audit log</button>
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
            <button onClick={() => { setVerifyModalTarget(null); setModalNote('') }} className="px-4 py-2 rounded-md border hairline text-[13px] font-medium text-ink-700">Cancel</button>
            <button onClick={handleVerify} className="px-4 py-2 rounded-md bg-signal-green text-white text-[13px] font-medium hover:bg-signal-green/90">Verify & Close</button>
          </>
        }
      >
        <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 mb-2">Review note (optional)</label>
        <textarea
          value={modalNote}
          onChange={(e) => setModalNote(e.target.value)}
          placeholder="e.g. Looks good, photo evidence confirms the fix."
          rows={3}
          className="focus-ring w-full px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-800 text-[13px] resize-none"
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
            <button onClick={() => { setReopenModalTarget(null); setModalNote('') }} className="px-4 py-2 rounded-md border hairline text-[13px] font-medium text-ink-700">Cancel</button>
            <button onClick={handleReopen} disabled={!modalNote.trim()} className="px-4 py-2 rounded-md bg-signal-red text-white text-[13px] font-medium hover:bg-signal-red/90 disabled:opacity-50">Reopen issue</button>
          </>
        }
      >
        <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 mb-2">Reason (required)</label>
        <textarea
          value={modalNote}
          onChange={(e) => setModalNote(e.target.value)}
          placeholder="Why is this being reopened?"
          rows={3}
          className="focus-ring w-full px-3 py-2 rounded-md border hairline bg-white dark:bg-ink-800 text-[13px] resize-none"
        />
      </Modal>
    </div>
  )
}

function KpiCell({ label, value, highlight }: { label: string; value: number; highlight?: 'amber' | 'green' }) {
  const highlightClass = highlight === 'amber' ? 'text-signal-amber' : highlight === 'green' ? 'text-signal-green' : 'text-ink-900 dark:text-ink-50'
  return (
    <div className="bg-white dark:bg-ink-950 p-5 flex flex-col justify-center min-h-[96px]">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">{label}</div>
      <div className={`mt-2 font-mono text-[24px] ${value > 0 ? highlightClass : 'text-ink-900 dark:text-ink-50'}`}>{value}</div>
    </div>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-9 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[12px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors cursor-pointer focus-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="chevron_down" className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none" />
    </div>
  )
}
