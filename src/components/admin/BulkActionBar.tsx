import { Icon } from '../primitives/Icon'
import type { IconName } from '../../types/role'

export interface BulkAction {
  key: string
  label: string
  icon: IconName
  /** Optional destructive flag — tints the button red */
  destructive?: boolean
  /** Optional disabled flag — e.g. "Resend invite" only valid when all selected are invited */
  disabled?: boolean
  onClick: () => void
}

interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  actions: BulkAction[]
}

export function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
  if (selectedCount === 0) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-up">
      <div className="flex items-center gap-1 px-2 py-2 rounded-xl border hairline bg-white dark:bg-ink-900 shadow-2xl backdrop-blur">
        {/* Count */}
        <div className="flex items-center gap-2 pl-3 pr-2">
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-ink-900 dark:bg-ink-50 text-ink-50 dark:text-ink-900 text-[10px] font-mono font-medium">
            {selectedCount}
          </span>
          <span className="text-[12px] text-ink-700 dark:text-ink-200">
            selected
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-ink-200 dark:bg-ink-700" />

        {/* Actions */}
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              action.destructive
                ? 'text-signal-red hover:bg-signal-red/10 disabled:text-ink-400 disabled:hover:bg-transparent'
                : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:text-ink-400 dark:disabled:text-ink-600 disabled:hover:bg-transparent'
            } disabled:cursor-not-allowed`}
            title={action.disabled ? 'Not available for this selection' : action.label}
          >
            <Icon name={action.icon} className="w-3.5 h-3.5" />
            {action.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-ink-200 dark:bg-ink-700" />

        {/* Clear */}
        <button
          onClick={onClear}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-50 transition-colors"
          aria-label="Clear selection"
        >
          <Icon name="close" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
