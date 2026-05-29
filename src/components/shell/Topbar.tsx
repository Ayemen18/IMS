import { Icon } from '../primitives/Icon'
import { ThemeToggle } from '../primitives/ThemeToggle'

interface TopbarProps {
  primaryActionLabel?: string
  onPrimaryAction?: () => void
}

export function Topbar({ primaryActionLabel, onPrimaryAction }: TopbarProps) {
  return (
    <div className="h-14 border-b border-white/10 bg-brand-navy-800 backdrop-blur-md sticky top-12 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 flex-1 max-w-[440px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-md transition-colors">
        <Icon name="search" className="w-4 h-4 text-white/40 shrink-0" />
        <input
          type="text"
          placeholder="Search inspections, templates, users…"
          className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
        />
        <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/40">
          ⌘K
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="relative w-8 h-8 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Icon name="bell" className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-signal-red" />
        </button>
        <ThemeToggle className="!text-white/70 hover:!text-white hover:!bg-white/10 !border-transparent dark:!text-white/70 dark:hover:!text-white dark:hover:!bg-white/10 dark:!border-transparent" />
        {primaryActionLabel && (
          <>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={onPrimaryAction}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-[12px] font-medium transition-colors border border-accent-400/30"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              {primaryActionLabel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
