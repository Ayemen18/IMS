import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNav } from '../../../lib/router'
import { useSession } from '../../../lib/session'
import { useInspections, formatRelativeTime } from '../../../lib/inspections'
import { useTemplates } from '../../../lib/templates'
import { Icon } from '../../../components/primitives/Icon'
import { Modal } from '../../../components/primitives/Modal'
import { BulkActionBar } from '../../../components/admin/BulkActionBar'
import { QueueRow } from '../../../components/reviewQueue/QueueRow'
import { PreviewPane } from '../../../components/reviewQueue/PreviewPane'
import type { InspectionDomain } from '../../../types/inspection'

type SortOption = 'oldest' | 'newest' | 'site' | 'inspector'

export function ReviewQueuePage({ domain = 'quality' }: { domain?: InspectionDomain }) {
  const nav = useNav()
  const prefix = domain === 'safety' ? '/sm' : '/qm'
  const { user } = useSession()
  const { inspections, approve, reject } = useInspections()
  const { getById: getTemplateById } = useTemplates()

  // State
  const [sort, setSort] = useState<SortOption>('oldest')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Derived data
  const queue = useMemo(() => {
    const pending = inspections.filter(i => i.domain === domain && (i.status === 'submitted' || i.status === 'under_review'))
    
    return pending.sort((a, b) => {
      const timeA = new Date(a.submittedAt || a.updatedAt).getTime()
      const timeB = new Date(b.submittedAt || b.updatedAt).getTime()
      
      switch (sort) {
        case 'oldest': return timeA - timeB
        case 'newest': return timeB - timeA
        case 'site': return a.siteName.localeCompare(b.siteName)
        case 'inspector': return (a.inspectorName || '').localeCompare(b.inspectorName || '')
        default: return 0
      }
    })
  }, [inspections, sort, domain])

  // Fix selectedIndex bounds if queue shrinks
  useEffect(() => {
    if (selectedIndex >= queue.length && queue.length > 0) {
      setSelectedIndex(queue.length - 1)
    }
  }, [queue.length, selectedIndex])

  const selectedItem = queue[selectedIndex] || null
  const selectedTemplate = selectedItem ? getTemplateById(selectedItem.templateId) : undefined

  // Auto-advance logic
  const handleActionComplete = useCallback((actedOnIds: string[]) => {
    // If we're acting on the current item, try to stay at the same index
    // The queue will shrink, so the NEXT item will fall into this index naturally
    // If we act on the last item, the useEffect above will clamp the index down
    setCheckedIds(prev => {
      const next = new Set(prev)
      actedOnIds.forEach(id => next.delete(id))
      return next
    })
  }, [])

  const handleApproveSelected = () => {
    if (!user || !selectedItem) return
    setSubmitting(true)
    setTimeout(() => {
      approve(selectedItem.id, user.email, user.name)
      setSubmitting(false)
      handleActionComplete([selectedItem.id])
    }, 240)
  }

  const handleRejectSelectedSubmit = () => {
    if (!user || !selectedItem || !rejectNote.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      reject(selectedItem.id, user.email, user.name, rejectNote.trim())
      setSubmitting(false)
      setRejectModalOpen(false)
      setRejectNote('')
      handleActionComplete([selectedItem.id])
    }, 240)
  }

  const handleBulkApprove = () => {
    if (!user || checkedIds.size === 0) return
    setSubmitting(true)
    setTimeout(() => {
      Array.from(checkedIds).forEach(id => {
        approve(id, user.email, user.name)
      })
      setSubmitting(false)
      handleActionComplete(Array.from(checkedIds))
    }, 400)
  }

  const handleBulkRejectSubmit = () => {
    if (!user || checkedIds.size === 0 || !rejectNote.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      Array.from(checkedIds).forEach(id => {
        reject(id, user.email, user.name, rejectNote.trim())
      })
      setSubmitting(false)
      setBulkRejectModalOpen(false)
      setRejectNote('')
      handleActionComplete(Array.from(checkedIds))
    }, 400)
  }

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (queue.length === 0) return

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, queue.length - 1))
          break
        case 'k':
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'x':
          if (selectedItem) toggleCheck(selectedItem.id)
          break
        case 'a':
          if (!rejectModalOpen && !bulkRejectModalOpen) handleApproveSelected()
          break
        case 'r':
          if (!rejectModalOpen && !bulkRejectModalOpen && selectedItem) {
            e.preventDefault()
            setRejectModalOpen(true)
          }
          break
        case 'Enter':
          if (selectedItem) nav.push(`${prefix}/inspections/${selectedItem.id}`)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queue, selectedItem, rejectModalOpen, bulkRejectModalOpen, user])

  const oldestWaiting = queue.length > 0 ? 
    [...queue].sort((a, b) => new Date(a.submittedAt || a.updatedAt).getTime() - new Date(b.submittedAt || b.updatedAt).getTime())[0] 
    : null

  const bulkActions = [
    {
      key: 'approve',
      label: `Approve ${checkedIds.size}`,
      onClick: handleBulkApprove,
      primary: true,
      icon: 'check' as const
    },
    {
      key: 'reject',
      label: `Reject ${checkedIds.size}…`,
      onClick: () => setBulkRejectModalOpen(true),
      destructive: true,
      icon: 'close' as const
    }
  ]

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-3">
            <span>{domain === 'safety' ? 'Safety Manager' : 'Quality Manager'}</span>
            <Icon name="chevron_right" className="w-3 h-3" />
            <span className="text-ink-900 dark:text-ink-50">Review queue</span>
          </div>
          <h1 className="font-display text-4xl text-ink-900 dark:text-ink-50 tracking-tight mb-2">
            Review <span className="italic text-ink-500 dark:text-ink-400">queue</span>.
          </h1>
          <p className="text-[14px] text-ink-600 dark:text-ink-300">
            {queue.length} submissions waiting {queue.length > 0 && oldestWaiting && `· oldest is ${formatRelativeTime(oldestWaiting.submittedAt || oldestWaiting.updatedAt)}`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <span className="text-ink-500">Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="bg-transparent border-none text-ink-900 dark:text-ink-50 font-medium focus:ring-0 p-0 pr-4 cursor-pointer"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="site">Site</option>
              <option value="inspector">Inspector</option>
            </select>
          </div>
          
          <button
            onClick={() => nav.push(`${prefix}/inspections`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border hairline text-ink-700 dark:text-ink-200 text-[12px] font-medium hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            View all inspections
          </button>
        </div>
      </div>

      {/* Split Layout */}
      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border hairline border-dashed rounded-xl py-32 text-center bg-white/50 dark:bg-ink-950/50">
          <div className="w-12 h-12 rounded-full border hairline bg-white dark:bg-ink-900 flex items-center justify-center mb-4 text-signal-green">
            <Icon name="check" className="w-5 h-5" />
          </div>
          <h2 className="text-[16px] font-medium text-ink-900 dark:text-ink-50 mb-1">All caught up.</h2>
          <p className="text-[13px] text-ink-500 mb-6">You have no submissions waiting for review.</p>
          <button
            onClick={() => nav.push(`${prefix}/inspections`)}
            className="text-[13px] font-medium text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
          >
            View all inspections
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row border hairline rounded-xl overflow-hidden bg-ink-50/30 dark:bg-ink-950/30 min-h-[500px]">
          
          {/* Left Pane: Queue List */}
          <div className="w-full lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r hairline bg-white dark:bg-ink-900 flex flex-col max-h-[400px] lg:max-h-none overflow-y-auto relative">
            {queue.map((inspection, i) => (
              <QueueRow
                key={inspection.id}
                inspection={inspection}
                isSelected={i === selectedIndex}
                isChecked={checkedIds.has(inspection.id)}
                onSelect={() => setSelectedIndex(i)}
                onToggleCheck={() => toggleCheck(inspection.id)}
              />
            ))}
          </div>

          {/* Right Pane: Preview */}
          <div className="flex-1 relative bg-white dark:bg-ink-950 overflow-hidden flex flex-col">
            <PreviewPane
              key={selectedItem?.id} // force re-mount when item changes
              inspection={selectedItem}
              template={selectedTemplate}
              onApprove={handleApproveSelected}
              onReject={() => setRejectModalOpen(true)}
              onViewFull={() => selectedItem && nav.push(`${prefix}/inspections/${selectedItem.id}`)}
            />
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {checkedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionBar
            selectedCount={checkedIds.size}
            onClear={() => setCheckedIds(new Set())}
            actions={bulkActions}
          />
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        open={rejectModalOpen}
        onClose={() => {
          if (submitting) return
          setRejectModalOpen(false)
          setRejectNote('')
        }}
        title={`Reject ${selectedItem?.number}?`}
        description={`${selectedItem?.inspectorName} will see this feedback and can resubmit after addressing it.`}
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
              onClick={handleRejectSelectedSubmit}
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
          autoFocus // helps keyboard users
          className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
        />
      </Modal>

      {/* Bulk Reject Modal */}
      <Modal
        open={bulkRejectModalOpen}
        onClose={() => {
          if (submitting) return
          setBulkRejectModalOpen(false)
          setRejectNote('')
        }}
        title={`Reject ${checkedIds.size} submissions?`}
        description={`The same note will be applied to every selected submission. The inspectors will be notified.`}
        size="md"
        dismissOnBackdrop={!submitting}
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkRejectModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-md border hairline bg-white dark:bg-ink-900 text-[13px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkRejectSubmit}
              disabled={submitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-signal-red text-white text-[13px] font-medium hover:bg-signal-red/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send back to inspectors'}
            </button>
          </>
        }
      >
        <label htmlFor="bulk-reject-note" className="block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400 mb-2">
          Reason
        </label>
        <textarea
          id="bulk-reject-note"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="What needs to be addressed before these can be approved?"
          rows={4}
          autoFocus
          className="focus-ring w-full px-3 py-2.5 rounded-md border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-[13px] text-ink-900 dark:text-ink-50 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors resize-none"
        />
      </Modal>
    </div>
  )
}
