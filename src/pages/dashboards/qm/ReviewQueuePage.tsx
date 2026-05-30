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
import { PageBanner } from '../../../components/shell/PageBanner'

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
    <div className="space-y-6">
      {/* Header Banner */}
      <PageBanner
        title={`Review queue`}
        subline={`${queue.length} submissions waiting ${ queue.length > 0 && oldestWaiting ? `· oldest is ${formatRelativeTime(oldestWaiting.submittedAt || oldestWaiting.updatedAt)}` : '' }`}
        actions={
          <button
            onClick={() => nav.push(`${prefix}/inspections`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold transition"
          >
            View all inspections
          </button>
        }
      />

      {/* Filter and Split Layout Area */}
      <div className="flex flex-col gap-4">
        {queue.length > 0 && (
          <div className="flex justify-end items-center px-2">
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortOption)}
                className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-primary hover:bg-accent-light transition-colors cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="oldest">Oldest first</option>
                <option value="newest">Newest first</option>
                <option value="site">Site</option>
                <option value="inspector">Inspector</option>
              </select>
              <Icon name="chevron_down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </div>
        )}

        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-text-secondary/15 rounded-2xl py-32 text-center bg-white shadow-soft">
            <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mb-4 text-status-pass">
              <Icon name="check" className="w-6 h-6" />
            </div>
            <h2 className="text-[16px] font-semibold text-text-primary mb-1">All caught up.</h2>
            <p className="text-[13px] text-text-secondary mb-6">You have no submissions waiting for review.</p>
            <button
              onClick={() => nav.push(`${prefix}/inspections`)}
              className="text-[13px] font-semibold text-primary hover:text-primary transition-colors"
            >
              View all inspections
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row border border-text-secondary/15 rounded-2xl overflow-hidden bg-white shadow-soft min-h-[500px]">
            {/* Left Pane: Queue List */}
            <div className="w-full lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-text-secondary/15 bg-white flex flex-col max-h-[400px] lg:max-h-none overflow-y-auto relative">
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
            <div className="flex-1 relative bg-white overflow-hidden flex flex-col">
              <PreviewPane
                key={selectedItem?.id}
                inspection={selectedItem}
                template={selectedTemplate}
                onApprove={handleApproveSelected}
                onReject={() => setRejectModalOpen(true)}
                onViewFull={() => selectedItem && nav.push(`${prefix}/inspections/${selectedItem.id}`)}
              />
            </div>
          </div>
        )}
      </div>

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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectSelectedSubmit}
              disabled={submitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-semibold hover:bg-status-fail/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send back to inspector'}
            </button>
          </>
        }
      >
        <label htmlFor="reject-note" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
          Reason
        </label>
        <textarea
          id="reject-note"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="What needs to be addressed before this can be approved?"
          rows={4}
          autoFocus
          className="w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition resize-none"
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
              className="px-4 py-2 rounded-lg border border-text-secondary/15 bg-white text-[13px] font-semibold text-text-secondary hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkRejectSubmit}
              disabled={submitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-fail text-white text-[13px] font-semibold hover:bg-status-fail/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send back to inspectors'}
            </button>
          </>
        }
      >
        <label htmlFor="bulk-reject-note" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary mb-2">
          Reason
        </label>
        <textarea
          id="bulk-reject-note"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="What needs to be addressed before these can be approved?"
          rows={4}
          autoFocus
          className="w-full px-3 py-2.5 rounded-lg border border-text-secondary/15 bg-white text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition resize-none"
        />
      </Modal>
    </div>
  )
}

