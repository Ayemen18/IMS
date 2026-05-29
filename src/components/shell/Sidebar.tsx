import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../primitives/Icon'
import { Wordmark } from '../primitives/Wordmark'
import { useSession, useCurrentRole } from '../../lib/session'
import { useNav } from '../../lib/router'
import { DASHBOARD_NAV } from '../../lib/dashboardNav'

interface SidebarProps {
  /**
   * Optional — when provided, overrides URL-based active detection.
   * Used by the Admin dashboard which still uses internal state in 7a.
   */
  activeItem?: string
  onSelectItem?: (key: string) => void
}

import type { RoleKey } from '../../types/role'

/**
 * Each role workspace lives under its own URL prefix.
 * Adding a role here is the only thing needed to wire sidebar URLs for that role.
 */
const ROLE_URL_PREFIX: Record<RoleKey, string> = {
  admin:              '/admin',
  quality_manager:    '/qm',
  safety_manager:     '/sm',
  quality_inspector:  '/qi',
  safety_inspector:   '/si',
  employee:           '/emp',
  top_management:     '/exec',
}

function keyToPath(roleKey: RoleKey, navKey: string): string {
  const prefix = ROLE_URL_PREFIX[roleKey] ?? '/'
  if (navKey === 'overview') return prefix
  return `${prefix}/${navKey}`
}

function pathToNavKey(roleKey: RoleKey, path: string): string {
  const prefix = ROLE_URL_PREFIX[roleKey] ?? '/'
  if (path === prefix || path === `${prefix}/`) return 'overview'
  const stripped = path.replace(new RegExp(`^${prefix}/?`), '')
  return stripped.split('/')[0] || 'overview'
}

export function Sidebar({ activeItem, onSelectItem }: SidebarProps) {
  const { user, signOut } = useSession()
  const role = useCurrentRole()
  const nav = useNav()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  if (!user || !role) return null
  const sections = DASHBOARD_NAV[role.key]

  // Resolve active item from URL unless caller provided one
  const resolvedActive = activeItem ?? (role ? pathToNavKey(role.key, location.pathname) : 'overview')

  const handleSelect = (key: string) => {
    if (role) nav.push(keyToPath(role.key, key))
    if (onSelectItem) onSelectItem(key)
  }

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-white/10 bg-brand-navy-800 sticky top-12 h-[calc(100vh-48px)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <button
          onClick={() => nav.push('/')}
          className="hover:opacity-80 transition-opacity"
        >
          <Wordmark />
        </button>
      </div>

      {/* Workspace card */}
      <button
        onClick={() => {
          signOut()
          nav.push('/login')
        }}
        className="mx-3 mt-3 mb-2 px-3 py-2.5 rounded-md border border-white/10 flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
        title="Switch workspace"
      >
        <div
          className={`w-7 h-7 rounded bg-brand-yellow-500/15 border border-brand-yellow-500/30 flex items-center justify-center shrink-0`}
        >
          <span className="font-display text-[13px] leading-none text-brand-yellow-500">
            {role.label.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">
            Workspace
          </div>
          <div className="text-[12px] font-medium text-white truncate">
            {role.label}
          </div>
        </div>
        <Icon name="chevron_down" className="w-3.5 h-3.5 text-white/60" />
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <div className="text-[10px] uppercase tracking-[0.14em] font-medium text-white/40 px-3 py-2">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = resolvedActive === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    className={`w-full group flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors relative ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-1 bg-brand-yellow-500 rounded-r" aria-hidden="true" />
                    )}
                    <Icon name={item.icon} className="w-[15px] h-[15px] shrink-0 text-current opacity-90 group-hover:opacity-100 transition-opacity" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-white/80'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="relative border-t border-white/10 px-3 py-3">
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-white/10 bg-brand-navy-900 shadow-lg overflow-hidden animate-fade-in">
            <button
              onClick={() => {
                setUserMenuOpen(false)
                signOut()
                nav.push('/login')
              }}
              className="w-full px-3 py-2.5 text-left text-[12px] text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        )}
        <button
          onClick={() => setUserMenuOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] text-white/80 hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium text-white shrink-0">
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white truncate">
              {user.name}
            </div>
            <div className="text-[10px] font-mono text-white/60 truncate">
              {user.email}
            </div>
          </div>
          <Icon name="chevron_down" className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>
    </aside>
  )
}
