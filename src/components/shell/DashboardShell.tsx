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
  hideTopbar = false,
  hideSidebar = false,
  children,
}: DashboardShellProps) {
  const [activeItem, setActiveItem] = useState(defaultItem)
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Yellow utility strip */}
      {!hideTopbar && (
        <div className="h-2 bg-warning shrink-0" aria-hidden="true" />
      )}

      {/* Navy Topbar */}
      {!hideTopbar && <Topbar />}

      {/* Two-column layout */}
      <div className="flex-1 flex min-h-0">
        {!hideSidebar && <Sidebar activeItem={activeItem} onSelectItem={setActiveItem} />}
        <main className="flex-1 min-w-0 overflow-y-auto bg-accent-light">
          <div className={hideTopbar && hideSidebar ? "" : "p-6 lg:p-8"}>
            {children(activeItem)}
          </div>
        </main>
      </div>
    </div>
  )
}
