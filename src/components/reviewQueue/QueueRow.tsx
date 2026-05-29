import { formatRelativeTime } from '../../lib/inspections'
import { getResponseSummary } from '../../types/inspection'
import type { Inspection } from '../../types/inspection'
import { Avatar } from '../primitives/Avatar'
import { Icon } from '../primitives/Icon'

interface QueueRowProps {
  inspection: Inspection
  isSelected: boolean
  isChecked: boolean
  onSelect: () => void
  onToggleCheck: () => void
}

export function QueueRow({ inspection, isSelected, isChecked, onSelect, onToggleCheck }: QueueRowProps) {
  const summary = getResponseSummary(inspection)
  const hasAttachments = inspection.responses.some(r => r.attachments && r.attachments.length > 0)
  const hasObservations = inspection.responses.some(r => !!r.observation)
  
  // Calculate age for highlighting
  const submittedAt = inspection.submittedAt || inspection.updatedAt
  const hoursOld = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60)
  const isOld = hoursOld > 4

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center gap-3 p-4 border-b hairline cursor-pointer transition-colors ${
        isSelected ? 'bg-ink-50 dark:bg-ink-800' : 'hover:bg-ink-50/50 dark:hover:bg-ink-800/50'
      }`}
    >
      {/* Selection stripe */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-900 dark:bg-ink-50" />
      )}

      {/* Checkbox (clicking this shouldn't trigger row selection) */}
      <div 
        className="shrink-0 pt-0.5"
        onClick={(e) => {
          e.stopPropagation()
          onToggleCheck()
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {}} // handled by div click
          className="w-4 h-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900 cursor-pointer"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={inspection.inspectorName ?? '?'} size="sm" />
            <span className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">
              {inspection.inspectorName ?? 'Unassigned'}
            </span>
          </div>
          <span className="shrink-0 font-mono text-[11px] text-ink-500">
            {inspection.number}
          </span>
        </div>

        <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50 truncate mb-1 leading-snug">
          {inspection.templateName}
        </div>
        
        <div className="text-[12px] text-ink-500 dark:text-ink-400 truncate mb-2">
          {inspection.siteName}{inspection.area ? ` · ${inspection.area}` : ''}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className={isOld ? 'text-signal-red' : 'text-ink-500'}>
            {formatRelativeTime(submittedAt)}
          </span>
          <span className="text-ink-300 dark:text-ink-700">|</span>
          <span className="text-signal-green">{summary.pass} ✓</span>
          {summary.fail > 0 && <span className="text-signal-red">{summary.fail} ✗</span>}
          {(hasAttachments || hasObservations) && <span className="text-ink-300 dark:text-ink-700">|</span>}
          {hasAttachments && <span title="Has attachments"><Icon name="link" className="w-3 h-3 text-ink-400" /></span>}
          {hasObservations && <span title="Has observations"><Icon name="file" className="w-3 h-3 text-ink-400" /></span>}
        </div>
      </div>
    </div>
  )
}
