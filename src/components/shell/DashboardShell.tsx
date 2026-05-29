import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardShellProps {
  defaultItem?: string
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  /**
   * Render-prop: receives the currently selected nav item key
   * so the page can swap its content accordingly.
   */
  children: (activeItem: string) => ReactNode
  hideTopbar?: boolean
  hideSidebar?: boolean
}

export function DashboardShell({
  defaultItem = 'overview',
  primaryActionLabel,
  onPrimaryAction,
  hideTopbar = false,
  hideSidebar = false,
  children,
}: DashboardShellProps) {
  const [activeItem, setActiveItem] = useState(defaultItem)
  return (
    <div className="min-h-[calc(100vh-48px)] flex bg-ink-50 dark:bg-ink-950">
      {!hideSidebar && <Sidebar activeItem={activeItem} onSelectItem={setActiveItem} />}
      <main className="flex-1 min-w-0">
        {!hideTopbar && <Topbar primaryActionLabel={primaryActionLabel} onPrimaryAction={onPrimaryAction} />}
        <div className={hideTopbar && hideSidebar ? "" : "p-6 lg:p-8"}>{children(activeItem)}</div>
      </main>
    </div>
  )
}
