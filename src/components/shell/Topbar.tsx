import { Icon } from '../primitives/Icon'
import { Wordmark } from '../primitives/Wordmark'
import { Avatar } from '../primitives/Avatar'
import { useSession, useCurrentRole } from '../../lib/session'
import { useNav } from '../../lib/router'

export function Topbar() {
  const { user } = useSession()
  const role = useCurrentRole()
  const nav = useNav()

  if (!user || !role) return null

  // Hardcode unread notifications indicator for demo purposes
  const hasUnread = true

  return (
    <header className="h-[72px] bg-primary px-6 flex items-center justify-between gap-6 sticky top-0 z-30">
      {/* Left: Logo + Nav Links */}
      <div className="flex items-center gap-6">
        <Wordmark variant="default" className="text-white shrink-0" />
        <div className="h-4 w-px bg-white/20 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={() => nav.push('/')}
            className="text-[13px] font-semibold text-white/85 hover:text-white transition-colors"
          >
            Landing
          </button>
          <button
            onClick={() => nav.push('/admin')}
            className="text-[13px] font-semibold text-white/85 hover:text-white transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-2xl hidden md:block">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/65" />
          <input
            type="text"
            placeholder="Search inspections, templates, users..."
            className="w-full bg-white/10 border border-white/15 rounded-lg pl-10 pr-12 py-2 text-[14px] text-white placeholder:text-white/70 focus:outline-none focus:bg-white/15 focus:border-white/25 transition"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/65 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Notifications + User Identity Card */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition">
          <Icon name="bell" className="w-5 h-5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-fail rounded-full ring-2 ring-primary" />
          )}
        </button>

        {/* Separator hairline */}
        <div className="w-px h-8 bg-white/15" />

        {/* User profile identifier */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/15">
          <div className="text-right">
            <div className="text-[13px] font-semibold text-white leading-tight">{user.name}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/60 leading-tight mt-0.5">{role.label}</div>
          </div>
          <Avatar name={user.name} size="w-9 h-9" />
        </div>
      </div>
    </header>
  )
}
